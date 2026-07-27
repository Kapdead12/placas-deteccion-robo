import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  rol: 'ADMIN' | 'OPERADOR';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET no está configurado (variable de entorno faltante)');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // Se ejecuta después de verificar la firma/expiración del token.
  // Volvemos a chequear contra la DB para que un usuario borrado no siga
  // pudiendo usar un token viejo hasta que expire.
  async validate(payload: JwtPayload) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: payload.sub } });
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado o token inválido');
    }
    return { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol };
  }
}
