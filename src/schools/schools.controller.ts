import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { School } from '@prisma/client';

@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get()
  async getAllSchools(): Promise<School[]> {
    return this.schoolsService.findAll();
  }

  @Get(':id')
  async getSchoolById(@Param('id') id: string): Promise<School | null> {
    return this.schoolsService.findById(id);
  }

  @Get(':id/stats')
  async getSchoolStats(@Param('id') id: string) {
    return this.schoolsService.getSchoolStats(id);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createSchool(@Body() data: { name: string }): Promise<School> {
    return this.schoolsService.create(data);
  }

  @Put(':id')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateSchool(
    @Param('id') id: string,
    @Body() data: { name?: string },
  ): Promise<School> {
    return this.schoolsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteSchool(@Param('id') id: string): Promise<School> {
    return this.schoolsService.delete(id);
  }
}
