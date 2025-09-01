import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { QueryPromotionsDto } from './dto/query-promotions.dto';
import type { Promotion } from '@prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    // Validar fechas si se proporcionan
    if (createPromotionDto.startsAt && createPromotionDto.endsAt) {
      const startDate = new Date(createPromotionDto.startsAt);
      const endDate = new Date(createPromotionDto.endsAt);

      if (startDate >= endDate) {
        throw new BadRequestException(
          'La fecha de inicio debe ser anterior a la fecha de fin',
        );
      }
    }

    // schoolId es opcional - no se valida que el colegio exista
    // Las promociones son del lugar, no necesariamente de un colegio específico

    return this.prisma.promotion.create({
      data: {
        title: createPromotionDto.title,
        description: createPromotionDto.description,
        points: createPromotionDto.points,
        schoolId: createPromotionDto.schoolId, // Puede ser null
        startsAt: createPromotionDto.startsAt
          ? new Date(createPromotionDto.startsAt)
          : null,
        endsAt: createPromotionDto.endsAt
          ? new Date(createPromotionDto.endsAt)
          : null,
        perUserCap: createPromotionDto.perUserCap,
      },
      include: {
        school: true, // Incluir si existe, null si no hay colegio
      },
    });
  }

  async findAll(queryDto: QueryPromotionsDto) {
    const { schoolId, search, active, page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (active !== undefined) {
      const now = new Date();
      if (active) {
        where.OR = [
          { startsAt: null, endsAt: null }, // Sin fechas = siempre activa
          { startsAt: { lte: now }, endsAt: { gte: now } }, // Dentro del rango
        ];
      } else {
        where.OR = [
          { startsAt: { gt: now } }, // Aún no ha comenzado
          { endsAt: { lt: now } }, // Ya terminó
        ];
      }
    }

    const [promotions, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        include: {
          school: true,
          _count: {
            select: { redemptions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return {
      promotions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Promotion> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        school: true,
        _count: {
          select: { redemptions: true },
        },
      },
    });

    if (!promotion) {
      throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
    }

    return promotion;
  }

  async update(
    id: string,
    updatePromotionDto: UpdatePromotionDto,
  ): Promise<Promotion> {
    // Verificar que la promoción existe
    const existingPromotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!existingPromotion) {
      throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
    }

    // Validar fechas si se proporcionan
    if (updatePromotionDto.startsAt && updatePromotionDto.endsAt) {
      const startDate = new Date(updatePromotionDto.startsAt);
      const endDate = new Date(updatePromotionDto.endsAt);

      if (startDate >= endDate) {
        throw new BadRequestException(
          'La fecha de inicio debe ser anterior a la fecha de fin',
        );
      }
    }

    // schoolId es opcional - no se valida que el colegio exista
    // Las promociones son del lugar, no necesariamente de un colegio específico

    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...(updatePromotionDto.title !== undefined && {
          title: updatePromotionDto.title,
        }),
        ...(updatePromotionDto.description !== undefined && {
          description: updatePromotionDto.description,
        }),
        ...(updatePromotionDto.points !== undefined && {
          points: updatePromotionDto.points,
        }),
        ...(updatePromotionDto.schoolId !== undefined && {
          schoolId: updatePromotionDto.schoolId, // Puede ser null
        }),
        ...(updatePromotionDto.startsAt !== undefined && {
          startsAt: updatePromotionDto.startsAt
            ? new Date(updatePromotionDto.startsAt)
            : null,
        }),
        ...(updatePromotionDto.endsAt !== undefined && {
          endsAt: updatePromotionDto.endsAt
            ? new Date(updatePromotionDto.endsAt)
            : null,
        }),
        ...(updatePromotionDto.perUserCap !== undefined && {
          perUserCap: updatePromotionDto.perUserCap,
        }),
      },
      include: {
        school: true, // Incluir si existe, null si no hay colegio
      },
    });
  }

  async delete(id: string): Promise<Promotion> {
    // Verificar que la promoción existe
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
    }

    // Verificar que no tenga redenciones activas
    const redemptionCount = await this.prisma.redemption.count({
      where: { promoId: id },
    });

    if (redemptionCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar una promoción que tiene redenciones activas',
      );
    }

    return this.prisma.promotion.delete({
      where: { id },
    });
  }

  async getStats(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
    }

    const redemptionCount = await this.prisma.redemption.count({
      where: { promoId: id },
    });

    // Calcular puntos totales dados (redenciones × puntos por promoción)
    const totalPointsGiven = redemptionCount * promotion.points;

    return {
      promotionId: id,
      redemptionCount,
      totalPointsGiven,
      pointsPerRedemption: promotion.points,
      isActive: this.isPromotionActive(promotion),
    };
  }

  private isPromotionActive(promotion: Promotion): boolean {
    const now = new Date();

    if (!promotion.startsAt && !promotion.endsAt) {
      return true; // Sin fechas = siempre activa
    }

    if (promotion.startsAt && now < promotion.startsAt) {
      return false; // Aún no ha comenzado
    }

    if (promotion.endsAt && now > promotion.endsAt) {
      return false; // Ya terminó
    }

    return true;
  }
}
