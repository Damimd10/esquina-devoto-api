import {
  Controller,
  Post,
  Param,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { QrService } from './qr.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SupabaseUser } from '../auth/supabase-auth.guard';

@Controller('promotions')
@UseGuards(SupabaseAuthGuard)
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post(':promoId/qr')
  @HttpCode(HttpStatus.CREATED)
  async issueQrToken(
    @Param('promoId') promoId: string,
    @Headers('x-device-id') deviceId: string,
    @CurrentUser() supabaseUser: SupabaseUser,
  ) {
    if (!deviceId || deviceId.length > 128) {
      throw new BadRequestException(
        'x-device-id header is required and must be ≤128 characters',
      );
    }

    return this.qrService.issueQrToken(promoId, supabaseUser.sub, deviceId);
  }

  @Post(':promoId/qr/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeQrToken(
    @Param('promoId') promoId: string,
    @Headers('x-device-id') deviceId: string,
    @CurrentUser() supabaseUser: SupabaseUser,
  ) {
    if (!deviceId || deviceId.length > 128) {
      throw new BadRequestException(
        'x-device-id header is required and must be ≤128 characters',
      );
    }

    await this.qrService.revokeActiveTokens(
      promoId,
      supabaseUser.sub,
      deviceId,
    );
  }
}
