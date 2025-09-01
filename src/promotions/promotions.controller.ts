import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { QueryPromotionsDto } from './dto/query-promotions.dto';

@Controller('promotions')
@UseGuards(SupabaseAuthGuard)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPromotion(@Body(ValidationPipe) createPromotionDto: CreatePromotionDto) {
    return this.promotionsService.create(createPromotionDto);
  }

  @Get()
  async getAllPromotions(@Query() queryPromotionsDto: QueryPromotionsDto) {
    return this.promotionsService.findAll(queryPromotionsDto);
  }

  @Get(':id')
  async getPromotionById(@Param('id') id: string) {
    return this.promotionsService.findById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updatePromotion(
    @Param('id') id: string,
    @Body(ValidationPipe) updatePromotionDto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(id, updatePromotionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deletePromotion(@Param('id') id: string) {
    return this.promotionsService.delete(id);
  }

  @Get(':id/stats')
  async getPromotionStats(@Param('id') id: string) {
    return this.promotionsService.getStats(id);
  }
}
