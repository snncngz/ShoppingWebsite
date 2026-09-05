import { PrismaClient } from "@prisma/client";

import { loadLocalEnv } from "./load-env";

loadLocalEnv();

// Ops: override local .env when targeting a remote database explicitly.
if (process.env.FORCE_DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = process.env.FORCE_DATABASE_URL.trim();
}

/** Storefront/admin ürün formunda kullanılan gerçek kategori kayıtları. */
const DEFAULT_CATEGORIES = [
  {
    name: "Parfüm",
    slug: "parfum",
    description:
      "Odun, amber, çiçek ve misk etrafında editorial kokular.",
  },
  {
    name: "T-Shirt",
    slug: "tshirt",
    description: "Yumuşak jersey ve örme siluetler; sakin lüksün temel katmanı.",
  },
  {
    name: "Pantolon",
    slug: "pantolon",
    description: "Terzilikten dökümlü palazzoya, ölçülü paça ve bel hatları.",
  },
  {
    name: "Gömlek",
    slug: "gomlek",
    description: "Temiz yakalar, ölçülü dokumalar ve sakin bir duruş.",
  },
  {
    name: "Ceket",
    slug: "ceket",
    description: "Katmanlı siluetler için ölçülü ceketler.",
  },
  {
    name: "Aksesuar",
    slug: "aksesuar",
    description: "Takı ve küçük aksesuarlar.",
  },
  {
    name: "Kemer",
    slug: "kemer",
    description: "Minimal tokalar ve yumuşak deri kemerler.",
  },
  {
    name: "Çanta",
    slug: "canta",
    description: "Günlük ve akşam için seçilmiş çantalar.",
  },
] as const;

async function main() {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PROD_ENSURE_CATEGORIES) {
    // Allow explicit ops runs against production when env is set by the operator.
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    for (const category of DEFAULT_CATEGORIES) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          description: category.description,
          isActive: true,
        },
        create: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          isActive: true,
        },
      });
      console.log(`Category ready: ${category.slug}`);
    }

    const parfum = await prisma.category.findUnique({ where: { slug: "parfum" } });
    if (parfum) {
      const perfumeSubs = [
        { name: "Kadın", slug: "womens" },
        { name: "Erkek", slug: "mens" },
        { name: "Unisex", slug: "unisex" },
      ] as const;
      for (const child of perfumeSubs) {
        await prisma.category.upsert({
          where: { slug: child.slug },
          update: {
            name: child.name,
            parentId: parfum.id,
            isActive: true,
          },
          create: {
            name: child.name,
            slug: child.slug,
            description: "",
            isActive: true,
            parentId: parfum.id,
          },
        });
        console.log(`Subcategory ready: ${child.slug}`);
      }
    }
    console.log(`Done. ${DEFAULT_CATEGORIES.length} categories ensured.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
