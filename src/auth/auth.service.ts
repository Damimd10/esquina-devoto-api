import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { UsersService } from '../users/users.service';
import { supabase } from './supabase-client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async confirmEmail(token: string) {
    try {
      // Verificar el token con Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      });

      if (error) {
        throw new UnauthorizedException(`Token inválido: ${error.message}`);
      }

      if (!data.user) {
        throw new UnauthorizedException('Usuario no encontrado en el token');
      }

      // Verificar que el email esté confirmado
      if (!data.user.email_confirmed_at) {
        throw new BadRequestException('Email no confirmado');
      }

      // Upsert user en nuestra base de datos
      const user = await this.usersService.upsertUserFromSupabase({
        sub: data.user.id,
        email: data.user.email,
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      });

      return {
        success: true,
        message: 'Email confirmado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      throw new UnauthorizedException(
        `Error confirmando email: ${error.message}`,
      );
    }
  }

  async getAuthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Auth service funcionando correctamente',
    };
  }
}
