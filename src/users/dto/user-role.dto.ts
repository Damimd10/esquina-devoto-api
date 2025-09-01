import { ApiProperty } from '@nestjs/swagger';

export class UserRoleDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User name', required: false })
  name?: string | null;

  @ApiProperty({ description: 'User role', enum: ['user', 'admin'] })
  role: string;

  @ApiProperty({ description: 'School ID', required: false })
  schoolId?: string | null;

  @ApiProperty({ description: 'Onboarding completed status' })
  onboardingCompleted: boolean;

  @ApiProperty({ description: 'School information', required: false })
  school?: {
    id: string;
    name: string;
  } | null;
}
