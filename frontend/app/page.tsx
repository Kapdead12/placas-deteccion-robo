'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  History,
  ScanLine,
  ShieldCheck,
  ShieldHalf,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  listarAlertas,
  listarCamaras,
  listarDetecciones,
  listarPlacas,
  type Alerta,
} from '@/lib/api';
import { StatCard } from '@/components/stat-card';
import { ErrorBanner } from '@/components/error-banner';
import { Loading } from '@/components/loading';

export default function HomePage() {
  const { usuario, cargando } = useAuth();

  if (cargando) return null;

  return usuario ? <Dashboard nombre={usuario.nombre} /> : <Landing />;
}

function Landing() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-20 text-center">
      <div>
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
          <ShieldHalf className="h-7 w-7" />
        </span>
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-amber-400">
          Sistema de prevención de robo vehicular
        </p>
        <h1 className="plate-display text-4xl font-bold text-gray-100 sm:text-5xl">
          ANPR CONSOLE
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-gray-400">
          Subí o capturá una imagen de una placa. El sistema la detecta con
          YOLO, lee el texto con OCR y verifica si está reportada.
        </p>
      </div>

      <Link
        href="/login"
        className="rounded-md bg-amber-500 px-8 py-3 text-sm font-semibold text-graphite-950 transition hover:bg-amber-400"
      >
        Ingresar al sistema
      </Link>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        <FeatureCard
          icon={ScanLine}
          title="Detección en tiempo real"
          description="YOLOv8 localiza la placa y EasyOCR lee el texto en segundos."
        />
        <FeatureCard
          icon={ShieldCheck}
          title="Verificación automática"
          description="Cada lectura se cruza contra la lista de placas reportadas."
        />
        <FeatureCard
          icon={AlertTriangle}
          title="Alertas centralizadas"
          description="Los matches quedan registrados y gestionables por un operador."
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ScanLine;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-graphite-700 bg-graphite-900/40 p-5 text-center">
      <Icon className="h-5 w-5 text-amber-400" />
      <p className="text-sm font-semibold text-gray-200">{title}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

interface Stats {
  totalDetecciones: number;
  detectadasHoy: number;
  alertasPendientes: number;
  placasActivas: number;
  camarasActivas: number;
}

function Dashboard({ nombre }: { nombre: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [alertasRecientes, setAlertasRecientes] = useState<Alerta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listarDetecciones(), listarAlertas(), listarPlacas(), listarCamaras()])
      .then(([detecciones, alertas, placas, camaras]) => {
        const hoy = new Date().toDateString();
        setStats({
          totalDetecciones: detecciones.length,
          detectadasHoy: detecciones.filter((d) => new Date(d.createdAt).toDateString() === hoy).length,
          alertasPendientes: alertas.filter((a) => a.estado === 'PENDIENTE').length,
          placasActivas: placas.filter((p) => p.activo).length,
          camarasActivas: camaras.filter((c) => c.activo).length,
        });
        setAlertasRecientes(alertas.filter((a) => a.estado === 'PENDIENTE').slice(0, 5));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar las métricas'))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Panel de control</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-100">
          Hola, {nombre.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-400">Estado general del sistema de detección.</p>
      </div>

      {cargando && <Loading label="Cargando métricas…" />}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {!cargando && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={History}
              label="Detecciones totales"
              value={stats?.totalDetecciones}
              hint={`${stats?.detectadasHoy ?? 0} hoy`}
            />
            <StatCard
              icon={AlertTriangle}
              label="Alertas pendientes"
              value={stats?.alertasPendientes}
              tone={stats && stats.alertasPendientes > 0 ? 'alert' : 'clear'}
            />
            <StatCard icon={ShieldCheck} label="Placas reportadas activas" value={stats?.placasActivas} />
            <StatCard icon={Camera} label="Cámaras activas" value={stats?.camarasActivas} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-3 rounded-lg border border-graphite-700 bg-graphite-900/60 p-6">
              <h2 className="text-sm font-semibold text-gray-200">Acciones rápidas</h2>
              <Link
                href="/detectar"
                className="flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-3 text-sm font-semibold text-graphite-950 transition hover:bg-amber-400"
              >
                <ScanLine className="h-4 w-4" /> Escanear placa
              </Link>
              <Link
                href="/historial"
                className="flex items-center justify-center gap-2 rounded-md border border-graphite-600 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-amber-400 hover:text-amber-400"
              >
                <History className="h-4 w-4" /> Ver historial
              </Link>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-graphite-700 bg-graphite-900/60 p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-200">Alertas pendientes recientes</h2>
                <Link href="/alertas" className="text-xs text-amber-400 hover:underline">
                  Ver todas
                </Link>
              </div>
              {alertasRecientes.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">Sin alertas pendientes. Todo tranquilo.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-graphite-800">
                  {alertasRecientes.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="plate-display font-bold text-red-400">
                        {a.deteccion.placa ?? '— SIN LECTURA —'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(a.createdAt).toLocaleString('es-BO')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
