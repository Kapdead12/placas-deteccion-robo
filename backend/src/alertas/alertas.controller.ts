import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator';
import { AlertasService } from './alertas.service';
import { UpdateEstadoAlertaDto } from './dto/update-estado-alerta.dto';

// Protegido por el guard global (JwtAuthGuard vía APP_GUARD en app.module.ts)
@Controller('alertas')
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  @Get()
  listar() {
    return this.alertasService.listar();
  }

  @Patch(':id')
  actualizarEstado(
    @Param('id') id: string,
    @Body() dto: UpdateEstadoAlertaDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.alertasService.actualizarEstado(id, dto.estado, user.id);
  }
}
