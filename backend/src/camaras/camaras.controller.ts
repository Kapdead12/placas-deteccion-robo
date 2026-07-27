import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CamarasService } from './camaras.service';
import { CreateCamaraDto } from './dto/create-camara.dto';
import { UpdateCamaraDto } from './dto/update-camara.dto';

// Protegido por el guard global (JwtAuthGuard vía APP_GUARD en app.module.ts)
@Controller('camaras')
export class CamarasController {
  constructor(private readonly camarasService: CamarasService) {}

  @Post()
  crear(@Body() dto: CreateCamaraDto) {
    return this.camarasService.crear(dto);
  }

  @Get()
  listar() {
    return this.camarasService.listar();
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: UpdateCamaraDto) {
    return this.camarasService.actualizar(id, dto);
  }

  @Delete(':id')
  desactivar(@Param('id') id: string) {
    return this.camarasService.desactivar(id);
  }
}
