'use client';

import { useEffect, useState } from 'react';
import { History as HistoryIcon } from 'lucide-react';
import { listarDetecciones, type DeteccionResult } from '@/lib/api';
import { RequireAuth } from '@/components/require-auth';
import { PageHeader } from '@/components/page-header';
import { Loading } from '@/components/loading';
import { ErrorBanner } from '@/components/error-banner';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/badge';

export default function HistorialPage() {
  const [detecciones, setDetecciones] = useState<DeteccionResult[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarDetecciones()
      .then(setDetecciones)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el historial'))
      .finally(() => setCargando(false));
  }, []);

  return (
    <RequireAuth>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Historial de detecciones"
          description="Últimas placas escaneadas por el sistema."
        />

        {cargando && <Loading />}
        {error && <ErrorBanner>{error}</ErrorBanner>}

        {!cargando && !error && detecciones.length === 0 && (
          <EmptyState
            icon={HistoryIcon}
            title="Todavía no hay detecciones"
            description="Las placas que escanees en Detectar van a aparecer acá."
          />
        )}

        {!cargando && !error && detecciones.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-graphite-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-graphite-900/80 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Placa</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Confianza</th>
                  <th className="px-4 py-3 text-right font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-800">
                {detecciones.map((d) => (
                  <tr key={d.id} className="transition hover:bg-graphite-900/40">
                    <td className="px-4 py-3">
                      <span
                        className={`plate-display font-bold ${d.reportada ? 'text-red-400' : 'text-gray-100'}`}
                      >
                        {d.placa ?? '— SIN LECTURA —'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.reportada ? (
                        <Badge tone="alert">
                          {d.coincidenciaAproximada ? 'Coincidencia probable' : 'Reportada'}
                        </Badge>
                      ) : (
                        <Badge tone="clear">Sin reportes</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      det {(d.confianzaDeteccion * 100).toFixed(0)}% · ocr{' '}
                      {(d.confianzaOcr * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">
                      {new Date(d.createdAt).toLocaleString('es-BO')}
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
