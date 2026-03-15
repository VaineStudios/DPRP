import { PrismaClient } from '@prisma/client';
import { seedShelters } from './shelters.js';
import { seedUsers } from './users.js';

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  console.log('Starting DPRP seed...\n');

  // Clear dependent tables first (order matters for FK constraints)
  await prisma.aiRecommendation.deleteMany();
  await prisma.shelterUpdate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shelter.deleteMany();

  console.log('[1/2] Seeding shelters...');
  await seedShelters(prisma);

  console.log('\n[2/2] Seeding users...');
  await seedUsers(prisma);

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
