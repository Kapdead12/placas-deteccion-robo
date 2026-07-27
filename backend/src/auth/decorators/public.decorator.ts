import { SetMetadata } from '@nestjs/common';

// Marca una ruta como accesible sin JWT (usado por JwtAuthGuard, que
// aplica autenticación global vía APP_GUARD en app.module.ts)
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
