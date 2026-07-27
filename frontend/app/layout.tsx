import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'ANPR · Placas-Deteccion-Robo',
  description: 'Consola de lectura y verificación de placas vehiculares',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="control-room-bg min-h-screen bg-graphite-950 text-gray-200 antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
