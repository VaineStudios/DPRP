import { PrismaClient } from '@prisma/client';
import { seedShelters } from './shelters.js';
import { seedUsers } from './users.js';
import { seedDisasters } from './disasters.js';

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  console.log('Starting DPRP seed...\n');

  // Clear dependent tables first (order matters for FK constraints)
  await prisma.aiRecommendation.deleteMany();
  await prisma.shelterUpdate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shelter.deleteMany();
  await prisma.disasterEvent.deleteMany();

  console.log('[1/3] Seeding shelters...');
  await seedShelters(prisma);

  console.log('\n[2/3] Seeding users...');
  await seedUsers(prisma);

  console.log('\n[3/3] Seeding disaster events...');
  await seedDisasters(prisma);

  console.log('\nSeed complete.');
};

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
