import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

interface DemoUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  shelterParish: string | null;
}

const DEMO_USERS: DemoUser[] = [
  {
    name: 'ODPEM Admin',
    email: 'admin@dprp.gov.jm',
    password: 'admin123',
    role: 'ADMIN',
    shelterParish: null,
  },
  {
    name: 'Manager St. Thomas',
    email: 'manager.stthomas@dprp.gov.jm',
    password: 'shelter123',
    role: 'SHELTER_MANAGER',
    shelterParish: 'St. Thomas',
  },
  {
    name: 'Manager Kingston',
    email: 'manager.kingston@dprp.gov.jm',
    password: 'shelter123',
    role: 'SHELTER_MANAGER',
    shelterParish: 'Kingston & St. Andrew',
  },
  {
    name: 'Manager St. James',
    email: 'manager.stjames@dprp.gov.jm',
    password: 'shelter123',
    role: 'SHELTER_MANAGER',
    shelterParish: 'St. James',
  },
  {
    name: 'Manager Portland',
    email: 'manager.portland@dprp.gov.jm',
    password: 'shelter123',
    role: 'SHELTER_MANAGER',
    shelterParish: 'Portland',
  },
  {
    name: 'Manager Westmoreland',
    email: 'manager.westmoreland@dprp.gov.jm',
    password: 'shelter123',
    role: 'SHELTER_MANAGER',
    shelterParish: 'Westmoreland',
  },
];

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  const SALT_ROUNDS = 10;

  for (const user of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

    let shelterId: string | null = null;
    if (user.shelterParish) {
      const shelter = await prisma.shelter.findFirst({
        where: { parish: user.shelterParish },
      });
      shelterId = shelter?.id ?? null;
    }

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
        shelterId,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
        shelterId,
      },
    });
  }

  console.log(`  Seeded ${DEMO_USERS.length} users (1 admin, 5 shelter managers)`);
}
