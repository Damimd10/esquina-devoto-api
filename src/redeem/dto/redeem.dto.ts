import { IsString, IsOptional } from 'class-validator';

export class RedeemDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  posId?: string;
}
