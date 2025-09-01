import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import * as jose from 'jose';

export interface IssueQrRes {
  token: string;
  expiresAt: string;
  serverNow: string;
  jti: string;
}

@Injectable()
export class QrService {
  constructor(
    private prisma: PrismaService,
    private promotionsService: PromotionsService,
    private configService: ConfigService,
  ) {}

  async issueQrToken(
    promoId: string,
    supabaseUid: string,
    deviceId: string,
  ): Promise<IssueQrRes> {
    // Obtener el usuario por supabaseUid
    const user = await this.prisma.user.findUnique({
      where: { supabaseUid },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar que la promoción existe y esté activa
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promoId },
    });

    if (!promotion) {
      throw new NotFoundException('Promoción no encontrada');
    }

    // Verificar que la promoción esté activa
    const now = new Date();
    if (promotion.startsAt && now < promotion.startsAt) {
      throw new BadRequestException('La promoción aún no ha comenzado');
    }
    if (promotion.endsAt && now >= promotion.endsAt) {
      throw new BadRequestException('La promoción ha expirado');
    }

    // Revocar cualquier token activo con la misma tupla (userId, promoId, deviceId)
    await this.revokeActiveTokens(promoId, supabaseUid, deviceId);

    // Calcular tiempo de expiración
    const ttlSeconds = this.configService.get<number>('QR_TTL_SECONDS', 120);
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    // Crear nuevo PromoToken
    const promoToken = await this.prisma.promoToken.create({
      data: {
        userId: user.id,
        promoId,
        deviceId,
        expiresAt,
        status: 'ISSUED',
      },
    });

    // Firmar JWT
    const secret = new TextEncoder().encode(
      this.configService.get<string>('QR_SECRET', 'default-secret'),
    );

    const jwt = await new jose.SignJWT({
      sub: user.id,
      pid: promoId,
      jti: promoToken.jti,
      dev: deviceId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(secret);

    return {
      token: jwt,
      expiresAt: expiresAt.toISOString(),
      serverNow: now.toISOString(),
      jti: promoToken.jti,
    };
  }

  async revokeActiveTokens(
    promoId: string,
    supabaseUid: string,
    deviceId: string,
  ): Promise<void> {
    // Obtener el usuario por supabaseUid
    const user = await this.prisma.user.findUnique({
      where: { supabaseUid },
    });

    if (!user) {
      return; // Usuario no encontrado, no hay nada que revocar
    }

    // Cambiar a REVOKED todos los tokens ISSUED vigentes
    await this.prisma.promoToken.updateMany({
      where: {
        userId: user.id,
        promoId,
        deviceId,
        status: 'ISSUED',
        expiresAt: { gt: new Date() }, // Solo tokens vigentes
      },
      data: {
        status: 'REVOKED',
      },
    });
  }
}
