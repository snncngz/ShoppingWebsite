-- AlterTable
ALTER TABLE "Category" ADD COLUMN "parentId" TEXT;

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Default Parfüm subcategories (skip if slug already exists)
INSERT INTO "Category" ("id", "name", "slug", "description", "isActive", "parentId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Women''s', 'womens', '', true, c."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Category" c
WHERE c.slug = 'parfum'
  AND NOT EXISTS (SELECT 1 FROM "Category" existing WHERE existing.slug = 'womens');

INSERT INTO "Category" ("id", "name", "slug", "description", "isActive", "parentId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Men''s', 'mens', '', true, c."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Category" c
WHERE c.slug = 'parfum'
  AND NOT EXISTS (SELECT 1 FROM "Category" existing WHERE existing.slug = 'mens');

INSERT INTO "Category" ("id", "name", "slug", "description", "isActive", "parentId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Unisex', 'unisex', '', true, c."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Category" c
WHERE c.slug = 'parfum'
  AND NOT EXISTS (SELECT 1 FROM "Category" existing WHERE existing.slug = 'unisex');
