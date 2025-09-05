import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import type { SupabaseUser } from '../auth/supabase-auth.guard';
import type { User } from '@prisma/client';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  schoolId: string | null;
  onboardingCompleted: boolean;
  school: any;
  pointsLedger: any[];
  totalPoints: number;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private async calculateTotalPoints(userId: string): Promise<number> {
    const result = await this.prisma.pointsLedger.aggregate({
      where: { userId },
      _sum: { delta: true },
    });
    return result._sum.delta || 0;
  }

  async upsertUserFromSupabase(
    supabaseUser: SupabaseUser,
  ): Promise<UserProfile> {
    const { sub: supabaseUid, email } = supabaseUser;

    const user = await this.prisma.user.upsert({
      where: { supabaseUid },
      update: {
        email: email || '',
        updatedAt: new Date(),
      },
      create: {
        supabaseUid,
        email: email || '',
        name: email?.split('@')[0] || 'Usuario', // Nombre por defecto del email
        role: 'USER',
      },
      include: {
        school: true,
        pointsLedger: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    const totalPoints = await this.calculateTotalPoints(user.id);

    return {
      ...user,
      totalPoints,
    };
  }

  async findById(id: string): Promise<UserProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        school: true,
        pointsLedger: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) return null;

    const totalPoints = await this.calculateTotalPoints(user.id);

    return {
      ...user,
      totalPoints,
    };
  }

  async findBySupabaseUid(supabaseUid: string): Promise<UserProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { supabaseUid },
      include: {
        school: true,
        pointsLedger: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) return null;

    const totalPoints = await this.calculateTotalPoints(user.id);

    return {
      ...user,
      totalPoints,
    };
  }

  async updateSchoolId(
    userId: string,
    schoolId: string | null,
  ): Promise<UserProfile> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { schoolId },
      include: {
        school: true,
        pointsLedger: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    const totalPoints = await this.calculateTotalPoints(user.id);

    return {
      ...user,
      totalPoints,
    };
  }

  async updateProfile(
    userId: string,
    data: { name?: string; schoolId?: string | null },
  ): Promise<UserProfile> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.schoolId !== undefined && { schoolId: data.schoolId }),
        updatedAt: new Date(),
      },
      include: {
        school: true,
        pointsLedger: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    const totalPoints = await this.calculateTotalPoints(user.id);

    return {
      ...user,
      totalPoints,
    };
  }

  async getPointsHistory(userId: string) {
    const [user, totalPoints, pointsHistory, redemptions] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      this.calculateTotalPoints(userId),
      this.prisma.pointsLedger.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      this.prisma.redemption.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          promotion: {
            select: { title: true, points: true },
          },
        },
      }),
    ]);

    return {
      user,
      totalPoints,
      pointsHistory,
      redemptions,
      summary: {
        totalRedemptions: redemptions.length,
        totalPointsEarned: pointsHistory
          .filter((entry) => entry.delta > 0)
          .reduce((sum, entry) => sum + entry.delta, 0),
        totalPointsSpent: Math.abs(
          pointsHistory
            .filter((entry) => entry.delta < 0)
            .reduce((sum, entry) => sum + entry.delta, 0),
        ),
      },
    };
  }

  async completeOnboarding(
    userId: string,
    schoolId?: string | null,
  ): Promise<UserProfile> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
        ...(schoolId !== undefined && { schoolId }),
        updatedAt: new Date(),
      },
      include: {
        school: true,
        pointsLedger: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    const totalPoints = await this.calculateTotalPoints(user.id);

    return {
      ...user,
      totalPoints,
    };
  }

  // Métodos para el CRUD de administradores
  async findAllForAdmin(queryDto: any) {
    const { schoolId, role, search, page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          school: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async createUser(createUserDto: any) {
    const { email, name, role = 'USER', schoolId } = createUserDto;

    // Verificar que el email no exista
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    // Generar un supabaseUid temporal (en producción esto vendría de Supabase)
    const tempSupabaseUid = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return this.prisma.user.create({
      data: {
        supabaseUid: tempSupabaseUid,
        email,
        name: name || email.split('@')[0],
        role,
        schoolId,
        onboardingCompleted: true, // Los usuarios creados por admin ya están "onboarded"
      },
      include: {
        school: true,
      },
    });
  }

  async updateUser(id: string, updateUserDto: any) {
    const { name, role, schoolId, onboardingCompleted } = updateUserDto;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(schoolId !== undefined && { schoolId }),
        ...(onboardingCompleted !== undefined && { onboardingCompleted }),
        updatedAt: new Date(),
      },
      include: {
        school: true,
      },
    });
  }

  async deleteUser(id: string) {
    // Verificar que el usuario no tenga redenciones activas
    const redemptionCount = await this.prisma.redemption.count({
      where: { userId: id },
    });

    if (redemptionCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar un usuario que tiene redenciones activas',
      );
    }

    // Eliminar registros relacionados primero
    await this.prisma.pointsLedger.deleteMany({
      where: { userId: id },
    });

    await this.prisma.promoToken.deleteMany({
      where: { userId: id },
    });

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getUserStats(userId: string) {
    const [user, totalPoints, redemptionCount, pointsHistory] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { school: true },
      }),
      this.calculateTotalPoints(userId),
      this.prisma.redemption.count({
        where: { userId },
      }),
      this.prisma.pointsLedger.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      user,
      totalPoints,
      redemptionCount,
      recentPointsHistory: pointsHistory,
      summary: {
        totalRedemptions: redemptionCount,
        totalPointsEarned: pointsHistory
          .filter((entry) => entry.delta > 0)
          .reduce((sum, entry) => sum + entry.delta, 0),
        totalPointsSpent: Math.abs(
          pointsHistory
            .filter((entry) => entry.delta < 0)
            .reduce((sum, entry) => sum + entry.delta, 0),
        ),
      },
    };
  }
}
