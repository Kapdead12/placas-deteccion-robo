import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DeteccionController } from './deteccion.controller';
import { DeteccionService } from './deteccion.service';

@Module({
  imports: [HttpModule],
  controllers: [DeteccionController],
  providers: [DeteccionService],
})
export class DeteccionModule {}
