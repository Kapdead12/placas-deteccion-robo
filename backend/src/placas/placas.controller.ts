import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreatePlacaReportadaDto } from './dto/create-placa-reportada.dto';
import { PlacasService } from './placas.service';

// Punto 9 del PDF (lógica de negocio): CRUD de placas reportadas contra
// las que se cruza cada detección del módulo `deteccion`.
@Controller('placas')
export class PlacasController {
  constructor(private readonly placasService: PlacasService) {}

  @Post()
  crear(@Body() dto: CreatePlacaReportadaDto) {
    return this.placasService.crear(dto);
  }

  @Get()
  listar() {
    return this.placasService.listar();
  }

  @Delete(':id')
  desactivar(@Param('id') id: string) {
    return this.placasService.desactivar(id);
  }
}
