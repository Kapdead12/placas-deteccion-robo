'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

// Envuelve páginas que necesitan sesión. Si no hay token tras hidratar
// desde localStorage, redirige a /login.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !token) {
      router.replace('/login');
    }
  }, [cargando, token, router]);

  if (cargando || !token) {
    return (
      <div className="flex justify-center py-16 text-sm text-gray-500">
        Verificando sesión…
      </div>
    );
  }

  return <>{children}</>;
}
