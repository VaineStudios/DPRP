import type { PrismaClient } from '@prisma/client';

export const seedDisasters = async (prisma: PrismaClient): Promise<void> => {
  const now = new Date();

  // ── Hurricane Melissa (Category 3, CLOSED — 6 months ago) ──
  const melissaStart = new Date(now.getTime() - 180 * 24 * 3600_000);
  const melissaEnd = new Date(melissaStart.getTime() + 3 * 24 * 3600_000);
  const melissaParishes = ['St. Thomas', 'Portland', 'St. Mary', 'Kingston & St. Andrew'];

  const melissa = await prisma.disasterEvent.create({
    data: {
      name: 'Hurricane Melissa',
      category: 3,
      windSpeedMph: 120,
      status: 'CLOSED',
      affectedParishes: melissaParishes,
      startDate: melissaStart,
      endDate: melissaEnd,
    },
  });
  console.log(`  Created: ${melissa.name} (${melissa.id})`);

  // ── Tropical Storm Nicole (Category 1, CLOSED — 3 months ago) ──
  const nicoleStart = new Date(now.getTime() - 90 * 24 * 3600_000);
  const nicoleEnd = new Date(nicoleStart.getTime() + 2 * 24 * 3600_000);
  const nicoleParishes = ['Westmoreland', 'St. James', 'Hanover', 'Trelawny'];

  const nicole = await prisma.disasterEvent.create({
    data: {
      name: 'Tropical Storm Nicole',
      category: 1,
      windSpeedMph: 65,
      status: 'CLOSED',
      affectedParishes: nicoleParishes,
      startDate: nicoleStart,
      endDate: nicoleEnd,
    },
  });
  console.log(`  Created: ${nicole.name} (${nicole.id})`);

  // ── Hurricane Dwayne (Category 3, ACTIVE — today) ──
  const dwayne = await prisma.disasterEvent.create({
    data: {
      name: 'Hurricane Dwayne',
      category: 3,
      windSpeedMph: 115,
      status: 'ACTIVE',
      affectedParishes: ['St. Thomas', 'Portland', 'Kingston & St. Andrew', 'St. Catherine'],
      startDate: now,
    },
  });
  console.log(`  Created: ${dwayne.name} (${dwayne.id})`);

  // ── Tropical Storm Keisha (Category 2, PREPARING — landfall in 2 days) ──
  const keisha = await prisma.disasterEvent.create({
    data: {
      name: 'Tropical Storm Keisha',
      category: 2,
      windSpeedMph: 95,
      status: 'PREPARING',
      affectedParishes: ['Westmoreland', 'St. James', 'Hanover', 'St. Elizabeth'],
      startDate: now,
      landfallDate: new Date(now.getTime() + 2 * 24 * 3600_000),
    },
  });
  console.log(`  Created: ${keisha.name} (${keisha.id})`);

  // ── Seed historical shelter updates for Hurricane Melissa ──
  console.log('  Seeding Hurricane Melissa updates...');
  const melissaShelters = await prisma.shelter.findMany({
    where: { parish: { in: melissaParishes } },
    select: { id: true },
  });

  if (melissaShelters.length === 0) {
    console.log('  WARNING: No shelters found for Melissa parishes. Skipping updates.');
  } else {
    const melissaUpdates: Array<{
      shelterId: string;
      disasterEventId: string;
      capacityLevel: number;
      waterLevel: number;
      foodLevel: number;
      medicalLevel: number;
      createdAt: Date;
    }> = [];

    // Pick up to 20 shelters to distribute 60 updates across
    const melissaSelectedShelters = melissaShelters.slice(0, 20);

    for (let i = 0; i < 60; i++) {
      const shelter = melissaSelectedShelters[i % melissaSelectedShelters.length];
      const hoursAfterStart = (i / 60) * 48; // Spread over 48 hours

      let capacityLevel: number;
      let waterLevel: number;
      let foodLevel: number;
      let medicalLevel: number;

      if (hoursAfterStart < 8) {
        // Early: low capacity, high resources
        capacityLevel = randInt(1, 2);
        waterLevel = randInt(4, 5);
        foodLevel = randInt(4, 5);
        medicalLevel = randInt(4, 5);
      } else if (hoursAfterStart < 24) {
        // Mid: moderate
        capacityLevel = randInt(3, 4);
        waterLevel = randInt(2, 3);
        foodLevel = randInt(3, 4);
        medicalLevel = randInt(3, 4);
      } else {
        // Late: critical
        capacityLevel = randInt(4, 5);
        waterLevel = randInt(1, 2);
        foodLevel = randInt(2, 3);
        medicalLevel = randInt(3, 3);
      }

      melissaUpdates.push({
        shelterId: shelter.id,
        disasterEventId: melissa.id,
        capacityLevel,
        waterLevel,
        foodLevel,
        medicalLevel,
        createdAt: new Date(melissaStart.getTime() + hoursAfterStart * 3600_000),
      });
    }

    await prisma.shelterUpdate.createMany({ data: melissaUpdates });
    console.log(`  Created ${melissaUpdates.length} updates for Hurricane Melissa`);
  }

  // ── Seed historical shelter updates for Tropical Storm Nicole ──
  console.log('  Seeding Tropical Storm Nicole updates...');
  const nicoleShelters = await prisma.shelter.findMany({
    where: { parish: { in: nicoleParishes } },
    select: { id: true },
  });

  if (nicoleShelters.length === 0) {
    console.log('  WARNING: No shelters found for Nicole parishes. Skipping updates.');
  } else {
    const nicoleUpdates: Array<{
      shelterId: string;
      disasterEventId: string;
      capacityLevel: number;
      waterLevel: number;
      foodLevel: number;
      medicalLevel: number;
      createdAt: Date;
    }> = [];

    const nicoleSelectedShelters = nicoleShelters.slice(0, 20);

    for (let i = 0; i < 40; i++) {
      const shelter = nicoleSelectedShelters[i % nicoleSelectedShelters.length];
      const hoursAfterStart = (i / 40) * 48; // Spread over 48 hours

      // Milder degradation — capacity peaking at 2-3, resources not dropping below 3
      const capacityLevel = hoursAfterStart < 16 ? randInt(1, 2) : randInt(2, 3);
      const waterLevel = hoursAfterStart < 16 ? randInt(4, 5) : randInt(3, 4);
      const foodLevel = hoursAfterStart < 16 ? randInt(4, 5) : randInt(3, 4);
      const medicalLevel = randInt(4, 5);

      nicoleUpdates.push({
        shelterId: shelter.id,
        disasterEventId: nicole.id,
        capacityLevel,
        waterLevel,
        foodLevel,
        medicalLevel,
        createdAt: new Date(nicoleStart.getTime() + hoursAfterStart * 3600_000),
      });
    }

    await prisma.shelterUpdate.createMany({ data: nicoleUpdates });
    console.log(`  Created ${nicoleUpdates.length} updates for Tropical Storm Nicole`);
  }

  console.log(`  Total: 4 disaster events, ${60 + 40} historical updates`);
};

const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;
