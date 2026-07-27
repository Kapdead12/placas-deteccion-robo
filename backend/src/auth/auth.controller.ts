import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CurrentUser, JwtUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  // Límite propio y más estricto que el default global: frena fuerza bruta
  // sobre credenciales sin afectar el resto de la API.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const usuario = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(usuario);
  }

  // Protegida por el guard global — sirve para que el frontend valide
  // el token guardado al recargar la página, sin volver a pedir login.
  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return user;
  }
}
