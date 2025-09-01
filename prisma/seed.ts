import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear colegios de ejemplo
  const schools = [
    { name: 'Colegio San Martín' },
    { name: 'Instituto Santa María' },
    { name: 'Escuela San José' },
    { name: 'Liceo San Francisco' },
    { name: 'Colegio San Ignacio' },
  ];

  console.log('🏫 Creando colegios...');

  for (const schoolData of schools) {
    const existingSchool = await prisma.school.findUnique({
      where: { name: schoolData.name },
    });

    if (!existingSchool) {
      const school = await prisma.school.create({
        data: schoolData,
      });
      console.log(`✅ Colegio creado: ${school.name} (ID: ${school.id})`);
    } else {
      console.log(`⏭️  Colegio ya existe: ${existingSchool.name}`);
    }
  }

  // Crear promociones de ejemplo
  console.log('🎯 Creando promociones...');

  const promotions = [
    {
      title: '2x1 en Cafetería',
      description: 'Lleva dos cafés por el precio de uno',
      points: 50,
      schoolId: null, // Promoción global
    },
    {
      title: 'Descuento en Librería',
      description: '20% off en todos los libros',
      points: 30,
      schoolId: null, // Promoción global
    },
  ];

  for (const promoData of promotions) {
    const existingPromo = await prisma.promotion.findFirst({
      where: { title: promoData.title },
    });

    if (!existingPromo) {
      const promotion = await prisma.promotion.create({
        data: promoData,
      });
      console.log(`✅ Promoción creada: ${promotion.title} (${promotion.points} puntos)`);
    } else {
      console.log(`⏭️  Promoción ya existe: ${existingPromo.title}`);
    }
  }

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
