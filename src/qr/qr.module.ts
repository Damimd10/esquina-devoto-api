import { Module } from '@nestjs/common';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';

@Module({
  controllers: [QrController],
  providers: [QrService, PrismaService, PromotionsService],
  exports: [QrService],
})
export class QrModule {}
