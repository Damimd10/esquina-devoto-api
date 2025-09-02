import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import type { School } from '@prisma/client';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<School[]> {
    return this.prisma.school.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<School | null> {
    return this.prisma.school.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<School | null> {
    return this.prisma.school.findUnique({
      where: { name },
    });
  }

  async create(data: {
    name: string;
    location?: { lat: number; lon: number };
  }): Promise<School> {
    return this.prisma.school.create({
      data: {
        name: data.name,
        // TODO: Agregar campo location cuando se implemente geobound
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; location?: { lat: number; lon: number } },
  ): Promise<School> {
    return this.prisma.school.update({
      where: { id },
      data: {
        name: data.name,
        // TODO: Agregar campo location cuando se implemente geobound
      },
    });
  }

  async delete(id: string): Promise<School> {
    return this.prisma.school.delete({
      where: { id },
    });
  }

  async getSchoolStats(schoolId: string) {
    const [userCount, promotionCount] = await Promise.all([
      this.prisma.user.count({
        where: { schoolId },
      }),
      this.prisma.promotion.count({
        where: { schoolId },
      }),
    ]);

    return {
      schoolId,
      userCount,
      promotionCount,
    };
  }
}
