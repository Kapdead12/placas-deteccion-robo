import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import placasVico from './data/placas-vico.json';

const prisma = new PrismaClient();

// Password de desarrollo del admin sembrado. Cambiar en producción.

const ADMIN_PASSWORD_DEV = 'admin123';

const MOTIVOS = [
  'Robo reportado a la PTJ',
  'Sustracción en vía pública',
  'Robo con violencia',
  'Vehículo con denuncia activa',
  'Reporte de aseguradora',
  'Alerta de control vehicular',
];

// Placas reales del padrón vehicular de El Alto (solo el número de placa,
// sin marca/chasis/color — no hace falta esa info para placas_reportadas).
// No implica que estas placas correspondan a vehículos robados; son datos
// reales usados únicamente para tener un seed con formato 100% realista
// (dígitos + letras, ej. "2959UKK" — ver PLATE_REGEX en ml-service/app/config.py).
const PLACAS_REALES: string[] = placasVico;

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fechaAleatoria(): Date {
  const dosAniosMs = 2 * 365 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - Math.random() * dosAniosMs);
}

async function seedPlacasReportadas() {
  const existentes = await prisma.placaReportada.count();
  if (existentes > 0) {
    console.log(`placas_reportadas ya tiene ${existentes} registros, no se re-siembra.`);
    return;
  }

  const placasElegidas = new Set<string>();
  const cantidad = Math.min(500, PLACAS_REALES.length);
  while (placasElegidas.size < cantidad) {
    placasElegidas.add(randomFrom(PLACAS_REALES));
  }

  const data = Array.from(placasElegidas).map((placa) => ({
    placa,
    motivo: randomFrom(MOTIVOS),
    activo: Math.random() < 0.85, // ~85% activas, resto desactivadas (para probar ese caso)
    fechaReporte: fechaAleatoria(),
  }));

  await prisma.placaReportada.createMany({ data, skipDuplicates: true });
  console.log(`Sembradas ${data.length} placas reportadas (con formato real del padrón).`);
}

// Usuario admin inicial, para no arrancar con la tabla usuarios vacía.
// El hash real ahora se genera con bcrypt (módulo auth ya implementado).
async function seedUsuarioAdmin() {
  const existente = await prisma.usuario.findUnique({ where: { email: 'admin@placas-deteccion-robo.local' } });
  if (existente) {
    console.log('Usuario admin ya existe, no se re-siembra.');
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD_DEV, 10);

  await prisma.usuario.create({
    data: {
      nombre: 'Admin',
      email: 'admin@placas-deteccion-robo.local',
      passwordHash,
      rol: 'ADMIN',
    },
  });
  console.log(
    `Sembrado usuario admin inicial. Login: admin@placas-deteccion-robo.local / ${ADMIN_PASSWORD_DEV}`,
  );
}

// Una cámara de prueba, para poder asociar detecciones a un punto de captura
// desde ya, aunque todavía no haya cámaras físicas conectadas.
async function seedCamaras() {
  const existentes = await prisma.camara.count();
  if (existentes > 0) {
    console.log(`camaras ya tiene ${existentes} registros, no se re-siembra.`);
    return;
  }

  await prisma.camara.create({
    data: { nombre: 'Carga manual / prueba', ubicacion: 'N/A' },
  });
  console.log('Sembrada cámara de prueba inicial.');
}

async function main() {
  await seedPlacasReportadas();
  await seedUsuarioAdmin();
  await seedCamaras();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
