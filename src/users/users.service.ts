import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
}
