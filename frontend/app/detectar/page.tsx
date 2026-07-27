'use client';

import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw, ScanLine, UploadCloud } from 'lucide-react';
import { detectarPlaca, type DeteccionResult } from '@/lib/api';
import { RequireAuth } from '@/components/require-auth';
import { PageHeader } from '@/components/page-header';
import { ErrorBanner } from '@/components/error-banner';

type Estado = 'idle' | 'procesando' | 'listo' | 'error';

export default function DetectarPage() {
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>('idle');
  const [resultado, setResultado] = useState<DeteccionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;

    setResultado(null);
    setError(null);
    setEstado('procesando');
    setImagenPreview(URL.createObjectURL(file));

    try {
      const data = await detectarPlaca(file);
      setResultado(data);
      setEstado('listo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setEstado('error');
    }
  }

  function onImgLoad() {
    if (imgRef.current) {
      setImgSize({
        w: imgRef.current.clientWidth,
        h: imgRef.current.clientHeight,
      });
    }
  }

  // Escala el bbox (coordenadas sobre la imagen original) al tamaño renderizado
  function bboxStyle() {
    if (
      !resultado ||
      !imgRef.current ||
      !imgSize ||
      resultado.bboxX1 == null ||
      resultado.bboxY1 == null ||
      resultado.bboxX2 == null ||
      resultado.bboxY2 == null
    ) {
      return null;
    }
    const natW = imgRef.current.naturalWidth;
    const natH = imgRef.current.naturalHeight;
    if (!natW || !natH) return null;

    const scaleX = imgSize.w / natW;
    const scaleY = imgSize.h / natH;

    return {
      left: resultado.bboxX1 * scaleX,
      top: resultado.bboxY1 * scaleY,
      width: (resultado.bboxX2 - resultado.bboxX1) * scaleX,
      height: (resultado.bboxY2 - resultado.bboxY1) * scaleY,
    };
  }

  const box = bboxStyle();
  const colorEstado = !resultado
    ? 'amber'
    : resultado.reportada
      ? 'alert'
      : 'clear';

  function reset() {
    setImagenPreview(null);
    setResultado(null);
    setError(null);
    setEstado('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <RequireAuth>
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Escanear placa"
          description={
            <>
              Subí una foto o usá la cámara del dispositivo. El pipeline YOLO + OCR corre en el
              ml-service y el resultado se cruza contra{' '}
              <code className="text-amber-400">placas_reportadas</code>.
            </>
          }
        />

        {!imagenPreview && (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-graphite-600 bg-graphite-900/50 py-16 text-center transition hover:border-amber-500 hover:bg-graphite-900/80">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <UploadCloud className="h-6 w-6" />
            </span>
            <span className="text-sm font-medium text-gray-300">
              Click para subir o capturar una imagen
            </span>
            <span className="text-xs text-gray-500">JPG, PNG — 1 placa por imagen</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        )}

        {imagenPreview && (
          <div className="flex flex-col gap-6">
            {/* Panel de imagen con overlay de escaneo / bbox */}
            <div
              className={`relative overflow-hidden rounded-lg border bg-graphite-900 ${
                colorEstado === 'alert'
                  ? 'border-alert'
                  : colorEstado === 'clear'
                    ? 'border-clear'
                    : 'border-graphite-600'
              }`}
            >
              <img
                ref={imgRef}
                src={imagenPreview}
                alt="Imagen capturada"
                onLoad={onImgLoad}
                className="max-h-120 w-full object-contain"
              />

              {estado === 'procesando' && (
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-0 bg-graphite-950/20" />
                  <div className="absolute left-0 h-0.5 w-full animate-scanline bg-amber-400 shadow-[0_0_12px_2px_rgba(245,158,11,0.8)]" />
                </div>
              )}

              {box && estado === 'listo' && (
                <div
                  className={`pointer-events-none absolute border-2 ${
                    colorEstado === 'alert' ? 'border-alert' : 'border-clear'
                  }`}
                  style={{
                    left: box.left,
                    top: box.top,
                    width: box.width,
                    height: box.height,
                  }}
                />
              )}
            </div>

            {/* Resultado tipo display LED */}
            {estado === 'procesando' && (
              <p className="flex items-center justify-center gap-2 text-center text-sm uppercase tracking-[0.3em] text-amber-400">
                <ScanLine className="h-4 w-4 animate-pulse" />
                Analizando imagen…
              </p>
            )}

            {estado === 'error' && <ErrorBanner>{error}</ErrorBanner>}

            {estado === 'listo' && resultado && (
              <div
                className={`rounded-lg border p-6 text-center ${
                  resultado.reportada
                    ? 'border-alert bg-alert/10'
                    : 'border-clear bg-clear/10'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {resultado.reportada ? (
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  )}
                  <p
                    className={`plate-display text-4xl font-bold sm:text-5xl ${
                      resultado.reportada ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {resultado.placa ?? '— SIN LECTURA —'}
                  </p>
                </div>
                <p
                  className={`mt-3 text-sm font-semibold ${
                    resultado.reportada ? 'text-red-300' : 'text-green-300'
                  }`}
                >
                  {resultado.alerta}
                </p>
                <div className="mt-4 flex justify-center gap-6 text-xs text-gray-400">
                  <span>
                    Confianza detección:{' '}
                    {(resultado.confianzaDeteccion * 100).toFixed(1)}%
                  </span>
                  <span>
                    Confianza OCR: {(resultado.confianzaOcr * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 self-center rounded-md border border-graphite-600 px-5 py-2 text-sm text-gray-300 transition hover:border-amber-400 hover:text-amber-400"
            >
              <RotateCcw className="h-4 w-4" />
              Escanear otra imagen
            </button>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
