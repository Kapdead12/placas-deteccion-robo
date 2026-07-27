export interface MlDetectResponse {
  placa: string | null;
  confianza_deteccion: number;
  confianza_ocr: number;
  bbox: [number, number, number, number] | null;
  mensaje: string;
  tiempo_procesamiento_ms: number;
}
