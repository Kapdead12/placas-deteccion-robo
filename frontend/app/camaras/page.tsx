'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Camera as CameraIcon, Plus } from 'lucide-react';
import { crearCamara, desactivarCamara, listarCamaras, type Camara } from '@/lib/api';
import { RequireAuth } from '@/components/require-auth';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { ErrorBanner } from '@/components/error-banner';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/badge';

export default function CamarasPage() {
  const [camaras, setCamaras] = useState<Camara[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [creando, setCreando] = useState(false);
  const [accionandoId, setAccionandoId] = useState<string | null>(null);

  useEffect(() => {
    listarCamaras()
      .then(setCamaras)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar las cámaras'))
      .finally(() => setCargando(false));
  }, []);

  async function handleCrear(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setError(null);
    setCreando(true);
    try {
      const nueva = await crearCamara({ nombre, ubicacion: ubicacion || undefined });
      setCamaras((prev) => [...prev, nueva]);
      setNombre('');
      setUbicacion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cámara');
    } finally {
      setCreando(false);
    }
  }

  async function handleDesactivar(id: string) {
    setAccionandoId(id);
    try {
      const actualizada = await desactivarCamara(id);
      setCamaras((prev) => prev.map((c) => (c.id === id ? actualizada : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo desactivar la cámara');
    } finally {
      setAccionandoId(null);
    }
  }

  return (
    <RequireAuth>
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Cámaras"
          description="Puntos de captura registrados para asociar a cada detección."
        />

        <form
          onSubmit={handleCrear}
          className="flex flex-col gap-3 rounded-lg border border-graphite-700 bg-graphite-900/60 p-4 sm:flex-row sm:items-end"
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="nombre" className="text-xs uppercase tracking-wide text-gray-400">
              Nombre
            </label>
            <input
              id="nombre"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="rounded-md border border-graphite-600 bg-graphite-950 px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-amber-500"
              placeholder="Entrada principal"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="ubicacion" className="text-xs uppercase tracking-wide text-gray-400">
              Ubicación
            </label>
            <input
              id="ubicacion"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="rounded-md border border-graphite-600 bg-graphite-950 px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-amber-500"
              placeholder="Portón norte"
            />
          </div>
          <button
            type="submit"
            disabled={creando}
            className="flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-graphite-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {creando ? 'Creando…' : 'Agregar cámara'}
          </button>
        </form>

        {cargando && <Loading />}
        {error && <ErrorBanner>{error}</ErrorBanner>}

        {!cargando && !error && camaras.length === 0 && (
          <EmptyState icon={CameraIcon} title="No hay cámaras registradas" description="Agregá un punto de captura con el formulario de arriba." />
        )}

        {!cargando && !error && camaras.length > 0 && (
          <div className="flex flex-col gap-2">
            {camaras.map((c) => (
              <div
                key={c.id}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 transition ${
                  c.activo
                    ? 'border-graphite-700 bg-graphite-900/60 hover:border-graphite-600'
                    : 'border-graphite-800 bg-graphite-900/30 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-graphite-800 text-gray-400">
                    <CameraIcon className="h-4 w-4" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-100">{c.nombre}</span>
                    <span className="text-xs text-gray-500">{c.ubicacion ?? 'Sin ubicación'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={c.activo ? 'clear' : 'neutral'}>{c.activo ? 'Activa' : 'Inactiva'}</Badge>
                  {c.activo && (
                    <button
                      onClick={() => handleDesactivar(c.id)}
                      disabled={accionandoId === c.id}
                      className="rounded border border-graphite-600 px-3 py-1 text-xs text-gray-300 transition hover:border-alert hover:text-red-300 disabled:opacity-60"
                    >
                      Desactivar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
