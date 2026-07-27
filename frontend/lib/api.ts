// Cliente contra el backend NestJS. Todas las rutas (salvo /auth/login)
// están protegidas por JWT global (ver backend/src/app.module.ts, APP_GUARD).

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const TOKEN_KEY = 'anpr_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Wrapper de fetch que agrega el header Authorization cuando hay sesión.
// Centraliza también el manejo de 401 (token vencido/ inválido): limpia la
// sesión guardada y fuerza vuelta a /login.
async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('anpr_token');
    localStorage.removeItem('anpr_usuario');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return res;
}

async function parseErrorBody(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => null);
  throw new Error(body?.message ?? fallback);
}

// ---------- Auth ----------

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'OPERADOR';
}

export interface LoginResult {
  accessToken: string;
  usuario: Usuario;
}

export async function loginRequest(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    await parseErrorBody(res, 'Credenciales inválidas');
  }
  return res.json();
}

// ---------- Detección ----------

export interface DeteccionResult {
  id: string;
  placa: string | null;
  confianzaDeteccion: number;
  confianzaOcr: number;
  bboxX1: number | null;
  bboxY1: number | null;
  bboxX2: number | null;
  bboxY2: number | null;
  reportada: boolean;
  coincidenciaAproximada: boolean;
  createdAt: string;
  usuarioId?: string | null;
  camaraId?: string | null;
  placaReportadaId?: string | null;
  mensajeMl?: string;
  alerta: string;
}

export async function detectarPlaca(file: File): Promise<DeteccionResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await authFetch('/deteccion', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    await parseErrorBody(res, 'No se pudo procesar la imagen');
  }
  return res.json();
}

export async function listarDetecciones(): Promise<DeteccionResult[]> {
  const res = await authFetch('/deteccion', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('No se pudo cargar el historial');
  }
  return res.json();
}

// ---------- Cámaras ----------

export interface Camara {
  id: string;
  nombre: string;
  ubicacion: string | null;
  activo: boolean;
  createdAt: string;
}

export async function listarCamaras(): Promise<Camara[]> {
  const res = await authFetch('/camaras', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar las cámaras');
  return res.json();
}

export async function crearCamara(data: { nombre: string; ubicacion?: string }): Promise<Camara> {
  const res = await authFetch('/camaras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) await parseErrorBody(res, 'No se pudo crear la cámara');
  return res.json();
}

export async function desactivarCamara(id: string): Promise<Camara> {
  const res = await authFetch(`/camaras/${id}`, { method: 'DELETE' });
  if (!res.ok) await parseErrorBody(res, 'No se pudo desactivar la cámara');
  return res.json();
}

// ---------- Alertas ----------

export type EstadoAlerta = 'PENDIENTE' | 'REVISADA' | 'DESCARTADA';

export interface Alerta {
  id: string;
  estado: EstadoAlerta;
  deteccionId: string;
  deteccion: DeteccionResult;
  atendidaPorId: string | null;
  atendidaPor: { id: string; nombre: string; email: string } | null;
  fechaAtencion: string | null;
  createdAt: string;
}

export async function listarAlertas(): Promise<Alerta[]> {
  const res = await authFetch('/alertas', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar las alertas');
  return res.json();
}

export async function actualizarEstadoAlerta(id: string, estado: EstadoAlerta): Promise<Alerta> {
  const res = await authFetch(`/alertas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) await parseErrorBody(res, 'No se pudo actualizar la alerta');
  return res.json();
}

// ---------- Placas reportadas ----------

export interface PlacaReportada {
  id: string;
  placa: string;
  motivo: string | null;
  activo: boolean;
  fechaReporte: string;
}

export async function listarPlacas(): Promise<PlacaReportada[]> {
  const res = await authFetch('/placas', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar las placas reportadas');
  return res.json();
}

export async function crearPlaca(data: { placa: string; motivo?: string }): Promise<PlacaReportada> {
  const res = await authFetch('/placas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) await parseErrorBody(res, 'No se pudo reportar la placa');
  return res.json();
}

export async function desactivarPlaca(id: string): Promise<PlacaReportada> {
  const res = await authFetch(`/placas/${id}`, { method: 'DELETE' });
  if (!res.ok) await parseErrorBody(res, 'No se pudo desactivar la placa');
  return res.json();
}
