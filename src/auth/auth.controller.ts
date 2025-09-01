import { Controller, Get, Post, Query, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('confirm')
  async confirmEmail(@Query('token') token: string, @Res() res: Response) {
    try {
      if (!token) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Token requerido',
        });
      }

      const result = await this.authService.confirmEmail(token);

      // Redirigir a la app móvil con mensaje de éxito
      const redirectUrl = `exp://192.168.1.34:8081?confirmed=true&message=${encodeURIComponent(result.message)}`;

      return res.redirect(HttpStatus.FOUND, redirectUrl);
    } catch (error) {
      // Redirigir a la app móvil con mensaje de error
      const redirectUrl = `exp://192.168.1.34:8081?confirmed=false&error=${encodeURIComponent(error.message)}`;

      return res.redirect(HttpStatus.FOUND, redirectUrl);
    }
  }

  @Get('status')
  async getAuthStatus() {
    return this.authService.getAuthStatus();
  }

  @Post('confirm')
  async confirmEmailPost(@Query('token') token: string) {
    if (!token) {
      throw new Error('Token requerido');
    }

    return this.authService.confirmEmail(token);
  }
}
