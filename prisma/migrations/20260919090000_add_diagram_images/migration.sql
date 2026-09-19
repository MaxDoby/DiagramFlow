CREATE TABLE "diagram_images" (
  "diagram_id" UUID NOT NULL,
  "file_name" VARCHAR(41) NOT NULL,
  CONSTRAINT "diagram_images_pkey" PRIMARY KEY ("diagram_id", "file_name"),
  CONSTRAINT "diagram_images_diagram_id_fkey" FOREIGN KEY ("diagram_id")
    REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Preserve existing image references, including images shared by duplicated diagrams.
INSERT INTO "diagram_images" ("diagram_id", "file_name")
SELECT DISTINCT d.id, substring(n->'data'->>'imageUrl' from 25)
FROM diagrams d
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(d.snapshot->'nodes') = 'array'
    THEN d.snapshot->'nodes' ELSE '[]'::jsonb END
) n
WHERE n->'data'->>'imageUrl' ~ '^/uploads/diagram-images/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$'
ON CONFLICT DO NOTHING;
