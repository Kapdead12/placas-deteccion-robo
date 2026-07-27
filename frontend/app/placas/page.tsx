'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { crearPlaca, desactivarPlaca, listarPlacas, type PlacaReportada } from '@/lib/api';
import { RequireAuth } from '@/components/require-auth';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { ErrorBanner } from '@/components/error-banner';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/badge';

export default function PlacasPage() {
  const [placas, setPlacas] = useState<PlacaReportada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [placa, setPlaca] = useState('');
  const [motivo, setMotivo] = useState('');
  const [creando, setCreando] = useState(false);
  const [accionandoId, setAccionandoId] = useState<string | null>(null);

  useEffect(() => {
    listarPlacas()
      .then(setPlacas)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar las placas reportadas'))
      .finally(() => setCargando(false));
  }, []);

  async function handleCrear(e: FormEvent) {
    e.preventDefault();
    if (!placa.trim()) return;
    setError(null);
    setCreando(true);
    try {
      const nueva = await crearPlaca({ placa: placa.trim().toUpperCase(), motivo: motivo || undefined });
      setPlacas((prev) => [...prev, nueva]);
      setPlaca('');
      setMotivo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reportar la placa');
    } finally {
      setCreando(false);
    }
  }

  async function handleDesactivar(id: string) {
    setAccionandoId(id);
    try {
      const actualizada = await desactivarPlaca(id);
      setPlacas((prev) => prev.map((p) => (p.id === id ? actualizada : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo desactivar la placa');
    } finally {
      setAccionandoId(null);
    }
  }

  return (
    <RequireAuth>
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Placas reportadas"
          description="Placas activas que se cruzan automáticamente contra cada detección para generar alertas."
        />

        <form
          onSubmit={handleCrear}
          className="flex flex-col gap-3 rounded-lg border border-graphite-700 bg-graphite-900/60 p-4 sm:flex-row sm:items-end"
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="placa" className="text-xs uppercase tracking-wide text-gray-400">
              Placa
            </label>
            <input
              id="placa"
              required
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              className="rounded-md border border-graphite-600 bg-graphite-950 px-3 py-2 text-sm uppercase text-gray-100 outline-none transition focus:border-amber-500"
              placeholder="ABC123"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="motivo" className="text-xs uppercase tracking-wide text-gray-400">
              Motivo
            </label>
            <input
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="rounded-md border border-graphite-600 bg-graphite-950 px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-amber-500"
              placeholder="Robo reportado el..."
            />
          </div>
          <button
            type="submit"
            disabled={creando}
            className="flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-graphite-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {creando ? 'Reportando…' : 'Reportar placa'}
          </button>
        </form>

        {cargando && <Loading />}
        {error && <ErrorBanner>{error}</ErrorBanner>}

        {!cargando && !error && placas.length === 0 && (
          <EmptyState icon={ShieldCheck} title="No hay placas reportadas" description="Reportá una placa con el formulario de arriba." />
        )}

        {!cargando && !error && placas.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-graphite-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-graphite-900/80 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Placa</th>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-800">
                {placas.map((p) => (
                  <tr key={p.id} className="transition hover:bg-graphite-900/40">
                    <td className="px-4 py-3">
                      <span className="plate-display font-bold text-gray-100">{p.placa}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {p.motivo ?? 'Sin motivo registrado'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.activo ? 'clear' : 'neutral'}>{p.activo ? 'Activa' : 'Inactiva'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.activo && (
                        <button
                          onClick={() => handleDesactivar(p.id)}
                          disabled={accionandoId === p.id}
                          className="rounded border border-graphite-600 px-3 py-1 text-xs text-gray-300 transition hover:border-alert hover:text-red-300 disabled:opacity-60"
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
