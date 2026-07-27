import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCamaraDto } from './dto/create-camara.dto';
import { UpdateCamaraDto } from './dto/update-camara.dto';

@Injectable()
export class CamarasService {
  constructor(private readonly prisma: PrismaService) {}

  crear(dto: CreateCamaraDto) {
    return this.prisma.camara.create({ data: dto });
  }

  listar() {
    return this.prisma.camara.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async actualizar(id: string, dto: UpdateCamaraDto) {
    await this.obtenerOFallar(id);
    return this.prisma.camara.update({ where: { id }, data: dto });
  }

  async desactivar(id: string) {
    await this.obtenerOFallar(id);
    return this.prisma.camara.update({ where: { id }, data: { activo: false } });
  }

  private async obtenerOFallar(id: string) {
    const camara = await this.prisma.camara.findUnique({ where: { id } });
    if (!camara) {
      throw new NotFoundException('Cámara no encontrada');
    }
    return camara;
  }
}
