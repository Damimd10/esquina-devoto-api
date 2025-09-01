import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jose from 'jose';

export interface SupabaseUser {
  sub: string; // supabase UID
  email?: string; // Opcional porque puede no estar en el JWT
  aud: string;
  exp: number;
  iat: number;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verificar con la clave secreta de Supabase
      if (process.env.SUPABASE_JWT_SECRET) {
        const secret = new TextEncoder().encode(
          process.env.SUPABASE_JWT_SECRET,
        );
        const { payload } = await jose.jwtVerify(token, secret, {
          issuer: 'https://hazdtpojryiaphfvkydd.supabase.co/auth/v1',
          audience: 'authenticated',
        });

        // Verificar que el token no haya expirado
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          throw new UnauthorizedException('Token expired');
        }

        // Agregar el usuario al request para uso posterior
        request['user'] = payload as unknown as SupabaseUser;
        return true;
      }

      throw new UnauthorizedException('SUPABASE_JWT_SECRET not configured');
    } catch (error) {
      console.error('Auth error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
