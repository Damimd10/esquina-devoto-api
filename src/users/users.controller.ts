import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SupabaseUser } from '../auth/supabase-auth.guard';
import { UserRoleDto } from './dto/user-role.dto';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() supabaseUser: SupabaseUser) {
    // Upsert user si es la primera vez que se autentica
    const user = await this.usersService.upsertUserFromSupabase(supabaseUser);
    return user;
  }

  @Get('me/points')
  async getUserPoints(@CurrentUser() supabaseUser: SupabaseUser) {
    const user = await this.usersService.findBySupabaseUid(supabaseUser.sub);
    if (!user) {
      throw new Error('User not found');
    }

    // Obtener historial completo de puntos y redenciones
    const pointsHistory = await this.usersService.getPointsHistory(user.id);
    return pointsHistory;
  }

  @Patch('me/onboarding')
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(
    @CurrentUser() supabaseUser: SupabaseUser,
    @Body() body: { schoolId?: string | null },
  ) {
    const user = await this.usersService.findBySupabaseUid(supabaseUser.sub);
    if (!user) {
      throw new Error('User not found');
    }

    return this.usersService.completeOnboarding(user.id, body.schoolId);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() supabaseUser: SupabaseUser,
    @Body() body: { name?: string; schoolId?: string | null },
  ) {
    const user = await this.usersService.findBySupabaseUid(supabaseUser.sub);
    if (!user) {
      throw new Error('User not found');
    }

    return this.usersService.updateProfile(user.id, body);
  }

  @Patch('me/school')
  @HttpCode(HttpStatus.OK)
  async updateSchool(
    @CurrentUser() supabaseUser: SupabaseUser,
    @Body() body: { schoolId: string | null },
  ) {
    const user = await this.usersService.findBySupabaseUid(supabaseUser.sub);
    if (!user) {
      throw new Error('User not found');
    }

    return this.usersService.updateSchoolId(user.id, body.schoolId);
  }

  @Get('role/:supabaseUid')
  async getUserRole(
    @Param('supabaseUid') supabaseUid: string,
  ): Promise<UserRoleDto> {
    const user = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
      schoolId: user.schoolId || undefined,
      onboardingCompleted: user.onboardingCompleted,
      school: user.school || undefined,
    };
  }
}
