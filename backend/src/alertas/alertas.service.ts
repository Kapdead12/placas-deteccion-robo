import { Injectable, NotFoundException } from '@nestjs/common';
import { EstadoAlerta } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertasService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.alerta.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        deteccion: true,
        atendidaPor: { select: { id: true, nombre: true, email: true } },
      },
    });
  }

  async actualizarEstado(id: string, estado: EstadoAlerta, atendidaPorId: string) {
    const alerta = await this.prisma.alerta.findUnique({ where: { id } });
    if (!alerta) {
      throw new NotFoundException('Alerta no encontrada');
    }

    return this.prisma.alerta.update({
      where: { id },
      data: {
        estado,
        // PENDIENTE es el estado inicial; solo dejamos rastro de quién/cuándo
        // atendió cuando realmente se resuelve (REVISADA o DESCARTADA).
        atendidaPorId: estado === EstadoAlerta.PENDIENTE ? null : atendidaPorId,
        fechaAtencion: estado === EstadoAlerta.PENDIENTE ? null : new Date(),
      },
      include: {
        deteccion: true,
        atendidaPor: { select: { id: true, nombre: true, email: true } },
      },
    });
  }
}
