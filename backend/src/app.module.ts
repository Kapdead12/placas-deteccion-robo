import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AlertasModule } from './alertas/alertas.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CamarasModule } from './camaras/camaras.module';
import { DeteccionModule } from './deteccion/deteccion.module';
import { PlacasModule } from './placas/placas.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Límite por defecto para toda la API (por IP); POST /auth/login usa un
    // límite más estricto propio via @Throttle (ver auth.controller.ts) para
    // frenar fuerza bruta sobre credenciales.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 30 }]),
    PrismaModule,
    AuthModule,
    DeteccionModule,
    PlacasModule,
    CamarasModule,
    AlertasModule,
  ],
  providers: [
    // Rate limiting global, se evalúa antes que la autenticación.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Autenticación global: toda ruta requiere JWT salvo las marcadas con @Public()
    // (hoy solo POST /auth/login). Ver jwt-auth.guard.ts.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
