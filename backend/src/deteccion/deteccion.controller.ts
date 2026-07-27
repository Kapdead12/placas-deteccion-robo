import {
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeteccionService } from './deteccion.service';

const MAX_TAMANIO_BYTES = 10 * 1024 * 1024; // 10MB

// Punto 8 del PDF: integración y consumo del modelo de IA vía API
@Controller('deteccion')
export class DeteccionController {
  constructor(private readonly deteccionService: DeteccionService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  detectar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: MAX_TAMANIO_BYTES,
            message: 'La imagen no puede superar los 10MB',
          }),
          // Valida el magic number real del archivo (no el content-type que
          // manda el cliente, que se puede falsificar fácilmente).
          new FileTypeValidator({ fileType: /^image\/(jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.deteccionService.procesarImagen(file);
  }

  @Get()
  listar() {
    return this.deteccionService.listarDetecciones();
  }
}
