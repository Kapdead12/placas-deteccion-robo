import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUser {
  id: string;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'OPERADOR';
}

// Extrae request.user, seteado por JwtStrategy.validate() tras pasar el guard global
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
