-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SHELTER_MANAGER');

-- CreateEnum
CREATE TYPE "DisasterStatus" AS ENUM ('PREPARING', 'ACTIVE', 'RECOVERY', 'CLOSED');

-- CreateEnum
CREATE TYPE "ShelterStatus" AS ENUM ('OPERATIONAL', 'OFFLINE');

-- CreateEnum
CREATE TYPE "UpdateSource" AS ENUM ('WEB', 'SMS');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('RESPONSE', 'PREPAREDNESS');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "shelter_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parish" TEXT NOT NULL,
    "location" TEXT,
    "areas_served" TEXT,
    "facility_type" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "max_capacity" INTEGER,
    "status" "ShelterStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shelters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disaster_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" INTEGER,
    "wind_speed_mph" DOUBLE PRECISION,
    "status" "DisasterStatus" NOT NULL DEFAULT 'PREPARING',
    "affected_parishes" TEXT[],
    "landfall_date" TIMESTAMP(3),
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disaster_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelter_updates" (
    "id" TEXT NOT NULL,
    "shelter_id" TEXT NOT NULL,
    "disaster_event_id" TEXT,
    "reported_by" TEXT,
    "capacity_level" INTEGER NOT NULL,
    "water_level" INTEGER NOT NULL,
    "food_level" INTEGER NOT NULL,
    "medical_level" INTEGER NOT NULL,
    "notes" TEXT,
    "source" "UpdateSource" NOT NULL DEFAULT 'WEB',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shelter_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendations" (
    "id" TEXT NOT NULL,
    "disaster_event_id" TEXT,
    "shelter_id" TEXT,
    "type" "RecommendationType" NOT NULL,
    "priority" "Priority" NOT NULL,
    "recommendation" TEXT NOT NULL,
    "reasoning" TEXT,
    "acknowledged_by" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "shelter_updates_shelter_id_created_at_idx" ON "shelter_updates"("shelter_id", "created_at");

-- CreateIndex
CREATE INDEX "shelter_updates_disaster_event_id_idx" ON "shelter_updates"("disaster_event_id");

-- CreateIndex
CREATE INDEX "ai_recommendations_disaster_event_id_type_idx" ON "ai_recommendations"("disaster_event_id", "type");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "shelters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelter_updates" ADD CONSTRAINT "shelter_updates_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "shelters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelter_updates" ADD CONSTRAINT "shelter_updates_disaster_event_id_fkey" FOREIGN KEY ("disaster_event_id") REFERENCES "disaster_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelter_updates" ADD CONSTRAINT "shelter_updates_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_disaster_event_id_fkey" FOREIGN KEY ("disaster_event_id") REFERENCES "disaster_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "shelters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
