import {
  Controller,
  Post,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { RedeemService } from './redeem.service';
import { PosApiKeyGuard } from './pos-api-key.guard';
import { RedeemDto } from './dto/redeem.dto';
import { RedeemResponseDto } from './dto/redeem-response.dto';

@Controller('redeem')
@UseGuards(PosApiKeyGuard)
export class RedeemController {
  constructor(private readonly redeemService: RedeemService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async redeemToken(
    @Body() redeemDto: RedeemDto,
    @Headers('x-api-key') apiKey: string,
  ): Promise<RedeemResponseDto> {
    if (!redeemDto.token) {
      throw new BadRequestException('Token is required');
    }

    return this.redeemService.redeemToken(redeemDto.token, redeemDto.posId);
  }
}
