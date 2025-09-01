import { PartialType } from '@nestjs/mapped-types';
import { CreatePromotionDto } from './create-promotion.dto';

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {
  title?: string;
  description?: string;
  points?: number;
  schoolId?: string;
  startsAt?: string;
  endsAt?: string;
  perUserCap?: number;
}
