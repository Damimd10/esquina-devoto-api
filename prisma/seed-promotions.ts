import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de promociones...');

  // Obtener colegios existentes para asignar algunas promociones
  const schools = await prisma.school.findMany();
  
  if (schools.length === 0) {
    console.log('⚠️  No hay colegios en la base de datos. Creando promociones solo del lugar.');
  }

  // Promociones del lugar (sin colegio específico)
  const placePromotions = [
    {
      title: 'Descuento 20% en Cafetería',
      description: 'Aplica en todos los productos de la cafetería del lugar. Válido para todos los usuarios.',
      points: 100,
      schoolId: null,
      startsAt: new Date('2024-01-01T00:00:00Z'),
      endsAt: new Date('2024-12-31T23:59:59Z'),
      perUserCap: 3,
    },
    {
      title: 'Promo de Cumpleaños',
      description: '¡Celebra tu cumpleaños con nosotros! 50% de descuento en cualquier producto.',
      points: 200,
      schoolId: null,
      startsAt: null, // Sin fechas = siempre activa
      endsAt: null,
      perUserCap: 1,
    },
    {
      title: 'Happy Hour - 2x1 en Bebidas',
      description: 'De 4:00 PM a 6:00 PM, lleva 2 bebidas por el precio de 1.',
      points: 150,
      schoolId: null,
      startsAt: new Date('2024-01-01T16:00:00Z'),
      endsAt: new Date('2024-12-31T18:00:00Z'),
      perUserCap: 2,
    },
    {
      title: 'Promo de Lunes',
      description: 'Todos los lunes, 30% de descuento en productos seleccionados.',
      points: 80,
      schoolId: null,
      startsAt: new Date('2024-01-01T00:00:00Z'),
      endsAt: new Date('2024-12-31T23:59:59Z'),
      perUserCap: 1,
    },
    {
      title: 'Combo Familiar',
      description: 'Ideal para compartir en familia. Incluye 4 productos por el precio de 3.',
      points: 300,
      schoolId: null,
      startsAt: new Date('2024-01-01T00:00:00Z'),
      endsAt: new Date('2024-12-31T23:59:59Z'),
      perUserCap: 2,
    },
  ];

  // Promociones específicas por colegio (si existen colegios)
  const schoolPromotions = schools.length > 0 ? [
    {
      title: 'Promo Especial San Ignacio',
      description: 'Exclusiva para estudiantes del Colegio San Ignacio. 25% de descuento en productos premium.',
      points: 250,
      schoolId: schools[0].id,
      startsAt: new Date('2024-01-15T00:00:00Z'),
      endsAt: new Date('2024-06-30T23:59:59Z'),
      perUserCap: 1,
    },
    {
      title: 'Descuento Estudiantil',
      description: 'Para todos los estudiantes del colegio. 15% de descuento en productos de estudio.',
      points: 120,
      schoolId: schools[0].id,
      startsAt: new Date('2024-01-01T00:00:00Z'),
      endsAt: new Date('2024-12-31T23:59:59Z'),
      perUserCap: 5,
    },
  ] : [];

  // Crear promociones del lugar
  console.log('🏪 Creando promociones del lugar...');
  for (const promoData of placePromotions) {
    const promotion = await prisma.promotion.create({
      data: promoData,
    });
    console.log(`✅ Promoción creada: ${promotion.title}`);
  }

  // Crear promociones por colegio (si existen)
  if (schoolPromotions.length > 0) {
    console.log('🏫 Creando promociones por colegio...');
    for (const promoData of schoolPromotions) {
      const promotion = await prisma.promotion.create({
        data: promoData,
      });
      console.log(`✅ Promoción por colegio creada: ${promotion.title}`);
    }
  }

  // Crear promociones temporales para demostración
  const tempPromotions = [
    {
      title: 'Promo de Verano',
      description: 'Refréscate este verano con nuestras bebidas especiales. 40% de descuento.',
      points: 180,
      schoolId: null,
      startsAt: new Date('2024-06-01T00:00:00Z'),
      endsAt: new Date('2024-08-31T23:59:59Z'),
      perUserCap: 3,
    },
    {
      title: 'Promo de Invierno',
      description: 'Calienta tu día con nuestras bebidas calientes. 35% de descuento.',
      points: 160,
      schoolId: null,
      startsAt: new Date('2024-12-01T00:00:00Z'),
      endsAt: new Date('2025-02-28T23:59:59Z'),
      perUserCap: 2,
    },
  ];

  console.log('🌤️  Creando promociones temporales...');
  for (const promoData of tempPromotions) {
    const promotion = await prisma.promotion.create({
      data: promoData,
    });
    console.log(`✅ Promoción temporal creada: ${promotion.title}`);
  }

  // Crear promociones que aún no han comenzado
  const futurePromotions = [
    {
      title: 'Promo de Año Nuevo',
      description: 'Comienza el año con descuentos especiales. 50% de descuento en productos seleccionados.',
      points: 400,
      schoolId: null,
      startsAt: new Date('2025-01-01T00:00:00Z'),
      endsAt: new Date('2025-01-31T23:59:59Z'),
      perUserCap: 1,
    },
  ];

  console.log('🔮 Creando promociones futuras...');
  for (const promoData of futurePromotions) {
    const promotion = await prisma.promotion.create({
      data: promoData,
    });
    console.log(`✅ Promoción futura creada: ${promotion.title}`);
  }

  // Crear promociones expiradas para demostración
  const expiredPromotions = [
    {
      title: 'Promo de Navidad 2023',
      description: 'Celebra la navidad con nosotros. 45% de descuento en productos festivos.',
      points: 350,
      schoolId: null,
      startsAt: new Date('2023-12-01T00:00:00Z'),
      endsAt: new Date('2023-12-25T23:59:59Z'),
      perUserCap: 2,
    },
  ];

  console.log('📅 Creando promociones expiradas...');
  for (const promoData of expiredPromotions) {
    const promotion = await prisma.promotion.create({
      data: promoData,
    });
    console.log(`✅ Promoción expirada creada: ${promotion.title}`);
  }

  console.log('🎉 Seed de promociones completado exitosamente!');
  console.log(`📊 Total de promociones creadas: ${placePromotions.length + schoolPromotions.length + tempPromotions.length + futurePromotions.length + expiredPromotions.length}`);
  
  // Mostrar resumen
  const totalPromotions = await prisma.promotion.count();
  const activePromotions = await prisma.promotion.count({
    where: {
      OR: [
        { startsAt: null, endsAt: null },
        { startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
      ],
    },
  });
  
  console.log(`📈 Estadísticas:`);
  console.log(`   - Total de promociones: ${totalPromotions}`);
  console.log(`   - Promociones activas: ${activePromotions}`);
  console.log(`   - Promociones del lugar: ${placePromotions.length}`);
  console.log(`   - Promociones por colegio: ${schoolPromotions.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
