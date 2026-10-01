CREATE TABLE "diagram_operations" (
    "id" UUID NOT NULL,
    "diagram_id" UUID NOT NULL,
    "user_id" UUID,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "diagram_operations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "diagram_operations_diagram_id_version_key" ON "diagram_operations"("diagram_id", "version");
ALTER TABLE "diagram_operations" ADD CONSTRAINT "diagram_operations_diagram_id_fkey" FOREIGN KEY ("diagram_id") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "diagram_operations" ADD CONSTRAINT "diagram_operations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
