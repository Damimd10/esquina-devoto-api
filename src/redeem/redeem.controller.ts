import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { RedeemService } from './redeem.service';
import { RedeemDto } from './dto/redeem.dto';
import { RedeemResponseDto } from './dto/redeem-response.dto';

@Controller('redeem')
export class RedeemController {
  constructor(private readonly redeemService: RedeemService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async redeemToken(
    @Body() redeemDto: RedeemDto,
  ): Promise<RedeemResponseDto> {
    if (!redeemDto.token) {
      throw new BadRequestException('Token is required');
    }

    return this.redeemService.redeemToken(redeemDto.token);
  }
}
