import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRoleDto } from './dto/user-role.dto';

@Controller('public/users')
export class PublicUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('role/:supabaseUid')
  async getUserRole(
    @Param('supabaseUid') supabaseUid: string,
  ): Promise<UserRoleDto> {
    try {
      const user = await this.usersService.findBySupabaseUid(supabaseUid);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
