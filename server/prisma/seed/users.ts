import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const DEMO_USERS = [
  {
    name: 'DPRP Admin',
    email: 'admin@dprp.gov.jm',
    password: 'admin123',
    role: 'ADMIN' as const,
    shelterParish: null,
  },
  {
    name: 'Shelter Manager Kingston',
    email: 'manager.kingston@dprp.gov.jm',
    password: 'shelter123',
    role: 'SHELTER_MANAGER' as const,
    shelterParish: 'Kingston & St. Andrew',
  },
  {
    name: 'Shelter Manager St. James',
    email: 'manager.stjames@dprp.gov.jm',
    password: 'shelter123',
    role: 'SHELTER_MANAGER' as const,
    shelterParish: 'St. James',
  },
  {
    name: 'Shelter Manager Portland',
    email: 'manager.portland@dprp.gov.jm',
    password: 'shelter123',
    role: 'SHELTER_MANAGER' as const,
    shelterParish: 'Portland',
  },
  {
    name: 'Shelter Manager St. Thomas',
    email: 'manager.stthomas@dprp.gov.jm',
    password: 'shelter123',
    role: 'SHELTER_MANAGER' as const,
    shelterParish: 'St. Thomas',
  },
  {
    name: 'Shelter Manager Westmoreland',
    email: 'manager.westmoreland@dprp.gov.jm',
    password: 'shelter123',
    role: 'SHELTER_MANAGER' as const,
    shelterParish: 'Westmoreland',
  },
];

export const seedUsers = async (prisma: PrismaClient): Promise<number> => {
  // Clear existing users
  await prisma.user.deleteMany();

  const SALT_ROUNDS = 10;
  let created = 0;

  for (const user of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

    let shelterId: string | null = null;
    if (user.shelterParish) {
      const shelter = await prisma.shelter.findFirst({
        where: { parish: user.shelterParish },
      });
      shelterId = shelter?.id ?? null;
    }

    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
        shelterId,
      },
    });
    created++;
  }

  console.log(`  Seeded ${created} users`);
  console.log('  Admin: admin@dprp.gov.jm / admin123');
  console.log('  Shelter managers: manager.*.@dprp.gov.jm / shelter123');

  return created;
};
