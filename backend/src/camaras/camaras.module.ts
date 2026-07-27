import { Module } from '@nestjs/common';
import { CamarasController } from './camaras.controller';
import { CamarasService } from './camaras.service';

@Module({
  controllers: [CamarasController],
  providers: [CamarasService],
  exports: [CamarasService],
})
export class CamarasModule {}
