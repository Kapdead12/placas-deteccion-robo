'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Lock, LogIn, Mail, ScanLine, ShieldCheck, ShieldHalf } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-graphite-700 bg-graphite-900/60 shadow-2xl shadow-black/40 md:grid-cols-2">
        {/* Panel de marca */}
        <div className="control-room-bg relative hidden flex-col justify-between gap-10 border-r border-graphite-700 bg-graphite-950 p-10 md:flex">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
              <ShieldHalf className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold tracking-wide text-gray-100">ANPR Console</span>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-amber-400">
              Sistema de prevención de robo vehicular
            </p>
            <h1 className="plate-display text-3xl font-bold leading-tight text-gray-100">
              Detección de placas en tiempo real
            </h1>
          </div>

          <ul className="flex flex-col gap-4 text-sm text-gray-400">
            <li className="flex items-center gap-3">
              <ScanLine className="h-4 w-4 shrink-0 text-amber-400" />
              Pipeline YOLOv8 + EasyOCR sobre cada imagen
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400" />
              Cruce automático contra placas reportadas
            </li>
            <li className="flex items-center gap-3">
              <Camera className="h-4 w-4 shrink-0 text-amber-400" />
              Historial y alertas centralizadas por operador
            </li>
          </ul>
        </div>

        {/* Panel de formulario */}
        <div className="flex flex-col justify-center gap-6 p-8 sm:p-10">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.3em] text-amber-400">Acceso restringido</p>
            <h2 className="text-xl font-semibold text-gray-100">Iniciar sesión</h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs uppercase tracking-wide text-gray-400">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-graphite-600 bg-graphite-950 py-2 pl-10 pr-3 text-sm text-gray-100 outline-none transition focus:border-amber-500"
                  placeholder="admin@placas-deteccion-robo.local"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs uppercase tracking-wide text-gray-400">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-graphite-600 bg-graphite-950 py-2 pl-10 pr-3 text-sm text-gray-100 outline-none transition focus:border-amber-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-alert bg-alert/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-2 flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-sm font-semibold text-graphite-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {enviando ? 'Verificando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
