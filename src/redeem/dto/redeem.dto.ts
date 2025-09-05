import { IsString } from 'class-validator';

export class RedeemDto {
  @IsString()
  token: string;
}
