import { Body, Controller, Post } from '@nestjs/common';
import * as jose from 'jose';

@Controller('redeem')
export class RedeemController {
  @Post('verify')
  async verify(@Body() body: { token: string }) {
    const secret = new TextEncoder().encode(
      process.env.QR_TOKEN_SECRET || 'dev-secret',
    );
    const { payload } = await jose.jwtVerify(body.token, secret);
    const { jti, promoId } = payload as any;

    // TODO: verificar:
    // - jti no usado (índice único)
    // - admin autorizado para promo/school
    // - límites por usuario/promo
    // - crear Redemption + PointsLedger(delta=promo.points)
    const userPoints = 42; // demo

    return { ok: true, userPoints };
  }
}
