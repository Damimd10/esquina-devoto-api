import { Module } from '@nestjs/common';
import { RedeemController } from './redeem.controller';
import { RedeemService } from './redeem.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RedeemController],
  providers: [RedeemService, PrismaService],
  exports: [RedeemService],
})
export class RedeemModule {}
