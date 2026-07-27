import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { MlDetectResponse } from './dto/ml-detect-response.dto';
import { levenshtein } from './levenshtein.util';

// Distancia de edición máxima tolerada para un match "aproximado" (cubre
// una sola confusión típica de OCR: 0↔O, 1↔I, 5↔S, 8↔B, etc.).
const MAX_DISTANCIA_TOLERADA = 1;

interface MatchPlacaReportada {
  id: string;
  activo: boolean;
  aproximado: boolean;
}

@Injectable()
export class DeteccionService {
  private readonly logger = new Logger(DeteccionService.name);
  private readonly mlServiceUrl: string;
  private readonly minOcrConfianzaAlerta: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.mlServiceUrl = this.configService.get<string>('ML_SERVICE_URL', 'http://localhost:8000');
    // Umbral mínimo de confianza de OCR para confiar en la lectura y cruzarla
    // contra placas_reportadas. Por debajo de esto, una lectura basura que
    // coincida por azar con una placa reportada dispararía una alerta falsa.
    this.minOcrConfianzaAlerta = Number(
      this.configService.get<string>('MIN_OCR_CONFIANZA_ALERTA', '0.5'),
    );
  }

  async procesarImagen(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ninguna imagen (campo "file")');
    }

    const resultadoMl = await this.consultarMlService(file);

    // Punto 9 del PDF: traducir la predicción del modelo a lógica de negocio.
    // Solo se cruza contra placas_reportadas si el OCR leyó con confianza
    // suficiente; si no, se guarda la detección pero nunca se marca reportada.
    const lecturaConfiable =
      resultadoMl.placa !== null && resultadoMl.confianza_ocr >= this.minOcrConfianzaAlerta;

    let reportada = false;
    let coincidenciaAproximada = false;
    let placaReportadaId: string | null = null;

    if (lecturaConfiable) {
      const match = await this.buscarPlacaReportada(resultadoMl.placa as string);
      if (match) {
        reportada = match.activo;
        coincidenciaAproximada = match.aproximado;
        placaReportadaId = match.id;
      }
    }

    const deteccion = await this.prisma.deteccion.create({
      data: {
        placa: resultadoMl.placa,
        confianzaDeteccion: resultadoMl.confianza_deteccion,
        confianzaOcr: resultadoMl.confianza_ocr,
        bboxX1: resultadoMl.bbox?.[0] ?? null,
        bboxY1: resultadoMl.bbox?.[1] ?? null,
        bboxX2: resultadoMl.bbox?.[2] ?? null,
        bboxY2: resultadoMl.bbox?.[3] ?? null,
        reportada,
        coincidenciaAproximada,
        placaReportadaId,
      },
    });

    // Solo se crea el registro de alerta cuando hubo match real con una
    // placa reportada activa — así "alertas" queda como historial gestionable,
    // separado de las detecciones crudas (que se siguen guardando todas).
    if (reportada) {
      await this.prisma.alerta.create({
        data: { deteccionId: deteccion.id },
      });
    }

    return {
      ...deteccion,
      mensajeMl: resultadoMl.mensaje,
      alerta: !reportada
        ? '✅ Sin reportes'
        : coincidenciaAproximada
          ? '⚠️ Posible placa reportada (coincidencia aproximada, revisar)'
          : '⚠️ Placa reportada como robada',
    };
  }

  // Busca primero un match exacto; si no hay, busca entre las placas
  // reportadas activas una a distancia de edición <= MAX_DISTANCIA_TOLERADA,
  // para tolerar confusiones típicas de OCR (0↔O, 1↔I, 5↔S, 8↔B, ...).
  private async buscarPlacaReportada(placaLeida: string): Promise<MatchPlacaReportada | null> {
    const exacta = await this.prisma.placaReportada.findUnique({ where: { placa: placaLeida } });
    if (exacta) {
      return { id: exacta.id, activo: exacta.activo, aproximado: false };
    }

    const candidatas = await this.prisma.placaReportada.findMany({ where: { activo: true } });

    let mejor: (MatchPlacaReportada & { distancia: number }) | null = null;
    for (const candidata of candidatas) {
      const distancia = levenshtein(placaLeida, candidata.placa);
      if (distancia > 0 && distancia <= MAX_DISTANCIA_TOLERADA) {
        if (!mejor || distancia < mejor.distancia) {
          mejor = { id: candidata.id, activo: candidata.activo, aproximado: true, distancia };
        }
      }
    }

    return mejor;
  }

  async listarDetecciones() {
    return this.prisma.deteccion.findMany({ orderBy: { createdAt: 'desc' } });
  }

  private async consultarMlService(file: Express.Multer.File): Promise<MlDetectResponse> {
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<MlDetectResponse>(`${this.mlServiceUrl}/detect`, formData, {
          headers: formData.getHeaders(),
        }),
      );
      return data;
    } catch (error) {
      this.logger.error(`Error al consultar ml-service: ${error.message}`);
      throw new BadRequestException('No se pudo procesar la imagen con el servicio de IA');
    }
  }
}
