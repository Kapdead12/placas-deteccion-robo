import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlacaReportadaDto } from './dto/create-placa-reportada.dto';

@Injectable()
export class PlacasService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CreatePlacaReportadaDto) {
    const placaNormalizada = dto.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');

    const existente = await this.prisma.placaReportada.findUnique({
      where: { placa: placaNormalizada },
    });
    if (existente) {
      throw new ConflictException('Esa placa ya está reportada');
    }

    return this.prisma.placaReportada.create({
      data: { placa: placaNormalizada, motivo: dto.motivo },
    });
  }

  async listar() {
    return this.prisma.placaReportada.findMany({
      where: { activo: true },
      orderBy: { fechaReporte: 'desc' },
    });
  }

  async desactivar(id: string) {
    const placa = await this.prisma.placaReportada.findUnique({ where: { id } });
    if (!placa) {
      throw new NotFoundException('Placa reportada no encontrada');
    }
    return this.prisma.placaReportada.update({
      where: { id },
      data: { activo: false },
    });
  }
}
