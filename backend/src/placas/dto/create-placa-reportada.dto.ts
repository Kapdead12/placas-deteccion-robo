import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePlacaReportadaDto {
  @IsString()
  @IsNotEmpty()
  placa: string;

  @IsString()
  @IsOptional()
  motivo?: string;
}
