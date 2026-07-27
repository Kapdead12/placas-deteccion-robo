import { IsBoolean, IsOptional, IsString } from 'class-validator';

// Manual en vez de PartialType (evita sumar @nestjs/mapped-types como
// dependencia nueva solo para esto).
export class UpdateCamaraDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
