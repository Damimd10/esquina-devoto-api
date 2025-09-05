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
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SupabaseUser } from '../auth/supabase-auth.guard';

// DTOs para el CRUD de usuarios
export class CreateUserDto {
  email: string;
  name?: string;
  role?: 'USER' | 'ADMIN';
  schoolId?: string;
}

export class UpdateUserDto {
  name?: string;
  role?: 'USER' | 'ADMIN';
  schoolId?: string;
  onboardingCompleted?: boolean;
}

export class QueryUsersDto {
  schoolId?: string;
  role?: 'USER' | 'ADMIN';
  search?: string;
  page?: number = 1;
  limit?: number = 20;
}

@Controller('admin/users')
@UseGuards(SupabaseAuthGuard)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(
    @Query() queryDto: QueryUsersDto,
    @CurrentUser() currentUser: SupabaseUser,
  ) {
    // TODO: Verificar que el usuario actual sea admin
    return this.usersService.findAllForAdmin(queryDto);
  }

  @Get(':id')
  async getUserById(
    @Param('id') id: string,
    @CurrentUser() currentUser: SupabaseUser,
  ) {
    // TODO: Verificar que el usuario actual sea admin
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: SupabaseUser,
  ) {
    // TODO: Verificar que el usuario actual sea admin
    return this.usersService.createUser(createUserDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: SupabaseUser,
  ) {
    // TODO: Verificar que el usuario actual sea admin
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: SupabaseUser,
  ) {
    // TODO: Verificar que el usuario actual sea admin
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    
    // Verificar que no sea el mismo usuario
    if (user.supabaseUid === currentUser.sub) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta');
    }
    
    return this.usersService.deleteUser(id);
  }

  @Get(':id/stats')
  async getUserStats(
    @Param('id') id: string,
    @CurrentUser() currentUser: SupabaseUser,
  ) {
    // TODO: Verificar que el usuario actual sea admin
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return this.usersService.getUserStats(id);
  }
}
