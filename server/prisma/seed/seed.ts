import { PrismaClient } from '@prisma/client';
import { seedShelters } from './shelters.js';
import { seedUsers } from './users.js';

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  console.log('🌱 Starting DPRP seed...\n');

  console.log('[1/2] Seeding shelters...');
  const shelterCount = await seedShelters(prisma);

  console.log('\n[2/2] Seeding users...');
  const userCount = await seedUsers(prisma);

  console.log(`\n✅ Seed complete: ${shelterCount} shelters, ${userCount} users`);
};

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
