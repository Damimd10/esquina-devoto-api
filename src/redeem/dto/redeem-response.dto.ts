export class RedeemResponseDto {
  status:
    | 'approved'
    | 'duplicate'
    | 'expired'
    | 'inactive'
    | 'out_of_cap'
    | 'revoked';
  redemptionId?: string;
  reason?: string;
}
