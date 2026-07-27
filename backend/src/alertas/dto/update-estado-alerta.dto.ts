import { IsEnum } from 'class-validator';
import { EstadoAlerta } from '@prisma/client';

export class UpdateEstadoAlertaDto {
  @IsEnum(EstadoAlerta)
  estado: EstadoAlerta;
}
