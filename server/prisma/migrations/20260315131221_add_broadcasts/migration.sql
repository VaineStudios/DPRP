-- CreateTable
CREATE TABLE "broadcasts" (
    "id" TEXT NOT NULL,
    "disaster_event_id" TEXT,
    "message" TEXT NOT NULL,
    "target_parishes" TEXT[],
    "priority" "Priority" NOT NULL DEFAULT 'HIGH',
    "sent_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "broadcasts_disaster_event_id_idx" ON "broadcasts"("disaster_event_id");

-- AddForeignKey
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_disaster_event_id_fkey" FOREIGN KEY ("disaster_event_id") REFERENCES "disaster_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
