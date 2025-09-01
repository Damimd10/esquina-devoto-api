import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Creando promociones activas para testing...');

  // Obtener colegios existentes
  const schools = await prisma.school.findMany();
  const schoolId = schools.length > 0 ? schools[0].id : null;

  // Promociones activas (sin fechas o con fechas futuras)
  const activePromotions = [
    {
      title: 'Café Gratis Hoy',
      description: '¡Un café gratis para todos! Válido solo hoy.',
      points: 50,
      schoolId: null, // Promoción del lugar
      startsAt: null, // Sin fecha de inicio = siempre activa
      endsAt: null,   // Sin fecha de fin = siempre activa
      perUserCap: 1,
    },
    {
      title: 'Descuento 30% en Bebidas',
      description: 'Aplica en todas las bebidas del menú.',
      points: 100,
      schoolId: null,
      startsAt: new Date('2024-01-01T00:00:00Z'), // Comenzó hace tiempo
      endsAt: new Date('2024-12-31T23:59:59Z'),   // Termina a fin de año
      perUserCap: 3,
    },
    {
      title: 'Promo de la Semana',
      description: '2x1 en productos seleccionados esta semana.',
      points: 150,
      schoolId: null,
      startsAt: new Date('2024-08-26T00:00:00Z'), // Lunes de esta semana
      endsAt: new Date('2024-09-01T23:59:59Z'),   // Domingo de esta semana
      perUserCap: 2,
    },
    {
      title: 'Happy Hour Especial',
      description: '50% de descuento en bebidas de 4 PM a 6 PM.',
      points: 80,
      schoolId: null,
      startsAt: new Date('2024-08-31T16:00:00Z'), // Hoy a las 4 PM
      endsAt: new Date('2024-08-31T18:00:00Z'),   // Hoy a las 6 PM
      perUserCap: 1,
    },
    {
      title: 'Promo de Cumpleaños',
      description: '¡Celebra tu cumpleaños con nosotros! Descuento especial.',
      points: 200,
      schoolId: null,
      startsAt: null, // Siempre activa
      endsAt: null,
      perUserCap: 1,
    },
  ];

  // Crear promociones activas
  console.log('🚀 Creando promociones activas...');
  for (const promoData of activePromotions) {
    const promotion = await prisma.promotion.create({
      data: promoData,
    });
    console.log(`✅ Promoción activa creada: ${promotion.title} (ID: ${promotion.id})`);
  }

  // Crear promociones específicas por colegio si existen
  if (schoolId) {
    const schoolPromotions = [
      {
        title: 'Promo Estudiantil Especial',
        description: 'Exclusiva para estudiantes del colegio. 25% de descuento.',
        points: 120,
        schoolId: schoolId,
        startsAt: new Date('2024-08-01T00:00:00Z'),
        endsAt: new Date('2024-12-31T23:59:59Z'),
        perUserCap: 5,
      },
    ];

    console.log('🏫 Creando promociones por colegio...');
    for (const promoData of schoolPromotions) {
      const promotion = await prisma.promotion.create({
        data: promoData,
      });
      console.log(`✅ Promoción por colegio creada: ${promotion.title} (ID: ${promotion.id})`);
    }
  }

  // Mostrar resumen
  const totalPromotions = await prisma.promotion.count();
  const activePromotionsCount = await prisma.promotion.count({
    where: {
      OR: [
        { startsAt: null, endsAt: null },
        { 
          AND: [
            { startsAt: { lte: new Date() } },
            { endsAt: { gte: new Date() } }
          ]
        }
      ]
    },
  });

  console.log('\n🎉 Seed completado exitosamente!');
  console.log(`📊 Total de promociones: ${totalPromotions}`);
  console.log(`✅ Promociones activas: ${activePromotionsCount}`);
  console.log('\n🔍 Para probar el QR, usa una de estas promociones activas:');
  
  const activePromos = await prisma.promotion.findMany({
    where: {
      OR: [
        { startsAt: null, endsAt: null },
        { 
          AND: [
            { startsAt: { lte: new Date() } },
            { endsAt: { gte: new Date() } }
          ]
        }
      ]
    },
    select: { id: true, title: true, points: true }
  });

  activePromos.forEach(promo => {
    console.log(`   - ${promo.title} (ID: ${promo.id}) - ${promo.points} puntos`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
