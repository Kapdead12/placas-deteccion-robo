import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCamaraDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
