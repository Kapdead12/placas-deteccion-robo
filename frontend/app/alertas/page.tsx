'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { actualizarEstadoAlerta, listarAlertas, type Alerta, type EstadoAlerta } from '@/lib/api';
import { RequireAuth } from '@/components/require-auth';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { ErrorBanner } from '@/components/error-banner';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/badge';

const ESTADOS: EstadoAlerta[] = ['PENDIENTE', 'REVISADA', 'DESCARTADA'];

function toneEstado(estado: EstadoAlerta): 'alert' | 'clear' | 'neutral' {
  switch (estado) {
    case 'PENDIENTE':
      return 'alert';
    case 'REVISADA':
      return 'clear';
    case 'DESCARTADA':
      return 'neutral';
  }
}

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  useEffect(() => {
    listarAlertas()
      .then(setAlertas)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar las alertas'))
      .finally(() => setCargando(false));
  }, []);

  async function cambiarEstado(id: string, estado: EstadoAlerta) {
    setActualizandoId(id);
    try {
      const actualizada = await actualizarEstadoAlerta(id, estado);
      setAlertas((prev) => prev.map((a) => (a.id === id ? actualizada : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la alerta');
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <RequireAuth>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Alertas"
          description="Detecciones que matchearon una placa reportada como robada."
        />

        {cargando && <Loading />}
        {error && <ErrorBanner>{error}</ErrorBanner>}

        {!cargando && !error && alertas.length === 0 && (
          <EmptyState icon={ShieldAlert} title="No hay alertas registradas" description="Cuando una detección matchee una placa reportada, va a aparecer acá." />
        )}

        {!cargando && !error && alertas.length > 0 && (
          <div className="flex flex-col gap-3">
            {alertas.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-3 rounded-lg border border-graphite-700 bg-graphite-900/60 px-4 py-3 transition hover:border-graphite-600 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="plate-display text-lg font-bold text-red-400">
                    {a.deteccion.placa ?? '— SIN LECTURA —'}
                  </span>
                  <Badge tone={toneEstado(a.estado)}>{a.estado}</Badge>
                  {a.deteccion.coincidenciaAproximada && (
                    <Badge tone="amber">Coincidencia probable</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{new Date(a.createdAt).toLocaleString('es-BO')}</span>
                  {a.atendidaPor && (
                    <span>
                      Atendida por <span className="text-gray-300">{a.atendidaPor.nombre}</span>
                    </span>
                  )}
                  <select
                    value={a.estado}
                    disabled={actualizandoId === a.id}
                    onChange={(e) => cambiarEstado(a.id, e.target.value as EstadoAlerta)}
                    className="rounded-md border border-graphite-600 bg-graphite-950 px-2 py-1 text-xs text-gray-200 outline-none transition focus:border-amber-500 disabled:opacity-60"
                  >
                    {ESTADOS.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
