import { IsString, IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  @Max(10000)
  points: number;

  @IsOptional()
  @IsString()
  schoolId?: string; // Opcional - para promociones específicas de colegio en el futuro

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  perUserCap?: number;
}
