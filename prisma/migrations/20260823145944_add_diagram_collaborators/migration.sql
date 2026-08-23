-- CreateTable
CREATE TABLE "diagram_collaborators" (
    "id" UUID NOT NULL,
    "diagram_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagram_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "diagram_collaborators_user_id_created_at_idx" ON "diagram_collaborators"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "diagram_collaborators_diagram_id_user_id_key" ON "diagram_collaborators"("diagram_id", "user_id");

-- AddForeignKey
ALTER TABLE "diagram_collaborators" ADD CONSTRAINT "diagram_collaborators_diagram_id_fkey" FOREIGN KEY ("diagram_id") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagram_collaborators" ADD CONSTRAINT "diagram_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
