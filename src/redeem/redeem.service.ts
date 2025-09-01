import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedeemResponseDto } from './dto/redeem-response.dto';
import * as jose from 'jose';

@Injectable()
export class RedeemService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async redeemToken(token: string, posId?: string): Promise<RedeemResponseDto> {
    try {
      // Verificar firma y exp del JWT
      const secret = new TextEncoder().encode(
        this.configService.get<string>('QR_SECRET', 'default-secret'),
      );

      const { payload } = await jose.jwtVerify(token, secret);
      const { sub: userId, pid: promoId, jti, dev: deviceId } = payload;

      // Buscar PromoToken por jti
      const promoToken = await this.prisma.promoToken.findUnique({
        where: { jti: jti as string },
        include: { promotion: true },
      });

      if (!promoToken) {
        return {
          status: 'revoked',
          reason: 'Token no encontrado',
        };
      }

      // Verificar status y expiración
      if (promoToken.status !== 'ISSUED') {
        return {
          status: 'revoked',
          reason: `Token ya no está activo (status: ${promoToken.status})`,
        };
      }

      const now = new Date();
      if (now > promoToken.expiresAt) {
        // Marcar token como expirado
        await this.prisma.promoToken.update({
          where: { jti: jti as string },
          data: { status: 'EXPIRED' },
        });

        return {
          status: 'expired',
          reason: 'Token ha expirado',
        };
      }

      // Verificar que la promoción esté activa
      const promotion = promoToken.promotion;
      if (promotion.startsAt && now < promotion.startsAt) {
        return {
          status: 'inactive',
          reason: 'La promoción aún no ha comenzado',
        };
      }
      if (promotion.endsAt && now >= promotion.endsAt) {
        return {
          status: 'inactive',
          reason: 'La promoción ha expirado',
        };
      }

      // Verificar perUserCap si existe
      if (promotion.perUserCap) {
        const approvedRedemptions = await this.prisma.redemption.count({
          where: {
            userId: userId as string,
            promoId: promoId as string,
            result: 'APPROVED',
          },
        });

        if (approvedRedemptions >= promotion.perUserCap) {
          return {
            status: 'out_of_cap',
            reason: `Límite de canjes alcanzado (${promotion.perUserCap})`,
          };
        }
      }

      // Verificar idempotencia
      const existingRedemption = await this.prisma.redemption.findUnique({
        where: { jti: jti as string },
      });

      if (existingRedemption) {
        return {
          status: 'duplicate',
          redemptionId: existingRedemption.id,
          reason: 'Token ya fue canjeado',
        };
      }

      // Transacción: crear Redemption, actualizar PromoToken e insertar PointsLedger
      const result = await this.prisma.$transaction(async (tx) => {
        // Crear Redemption
        const redemption = await tx.redemption.create({
          data: {
            userId: userId as string,
            promoId: promoId as string,
            adminId: posId || 'system', // Usar posId si está disponible
            jti: jti as string,
            result: 'APPROVED',
          },
        });

        // Actualizar PromoToken
        await tx.promoToken.update({
          where: { jti: jti as string },
          data: {
            status: 'REDEEMED',
            redeemedAt: now,
          },
        });

        // Insertar PointsLedger
        await tx.pointsLedger.create({
          data: {
            userId: userId as string,
            delta: promotion.points,
            reason: `Canje de promoción: ${promotion.title}`,
            promoId: promoId as string,
            redemptionId: redemption.id,
          },
        });

        return redemption;
      });

      return {
        status: 'approved',
        redemptionId: result.id,
        reason: 'Canje aprobado exitosamente',
      };
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        return {
          status: 'expired',
          reason: 'Token ha expirado',
        };
      }

      if (error instanceof jose.errors.JWTInvalid) {
        return {
          status: 'revoked',
          reason: 'Token inválido',
        };
      }

      // Log del error para debugging
      console.error('Error durante el canje:', error);

      return {
        status: 'revoked',
        reason: 'Error interno del servidor',
      };
    }
  }
}
