import { Module } from '@nestjs/common';
import { PlacasController } from './placas.controller';
import { PlacasService } from './placas.service';

@Module({
  controllers: [PlacasController],
  providers: [PlacasService],
  exports: [PlacasService],
})
export class PlacasModule {}
