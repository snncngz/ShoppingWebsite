import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";

import { loadLocalEnv } from "./load-env";

loadLocalEnv();

if (process.env.FORCE_DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = process.env.FORCE_DATABASE_URL.trim();
}

const CLOTHING_SIZES = ["S", "M", "L", "XL", "XXL"];

type DemoProduct = {
  slug: string;
  name: string;
  categorySlug: string;
  description: string;
  price: string;
  oldPrice?: string;
  color: string;
  imageUrl: string;
  isPopular: boolean;
  isNew: boolean;
};

const PRODUCTS: DemoProduct[] = [
  {
    slug: "basic-paca-stoper-gri-melanj",
    name: "Basic Paça Stoper Gri Melanj Eşofman",
    categorySlug: "esofman",
    description: "Bel lastikli, paça stoperli günlük eşofman altı.",
    price: "349.90",
    oldPrice: "699.00",
    color: "Gri Melanj",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/basic-paca-stoper-gri-melanj-esofman-a-318-4f.jpg",
    isPopular: true,
    isNew: false,
  },
  {
    slug: "basic-paca-stoper-antrasit",
    name: "Basic Paça Stoper Antrasit Eşofman",
    categorySlug: "esofman",
    description: "Antrasit paça stoper eşofman altı.",
    price: "349.90",
    oldPrice: "699.00",
    color: "Antrasit",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/basic-paca-stoper-antrasit-esofman-alt-b0f4-4.jpg",
    isPopular: true,
    isNew: false,
  },
  {
    slug: "basic-paca-stoper-lacivert",
    name: "Basic Paça Stoper Lacivert Eşofman",
    categorySlug: "esofman",
    description: "Lacivert paça stoper eşofman altı.",
    price: "349.90",
    oldPrice: "699.00",
    color: "Lacivert",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/basic-paca-stoper-lacivert-esofman-alt-53ca68.jpg",
    isPopular: true,
    isNew: false,
  },
  {
    slug: "old-money-baggy-pantolon-siyah",
    name: "Old Money Extra Rahat Baggy Pantolon Siyah",
    categorySlug: "pantolon",
    description: "Extra rahat baggy fit kumaş pantolon.",
    price: "999.00",
    color: "Siyah",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/old-money-extra-rahat-baggy-fit-kumas--e-19dd.jpg",
    isPopular: true,
    isNew: true,
  },
  {
    slug: "timeless-bel-lastikli-pantolon-siyah",
    name: "Timeless Bel Lastikli Kumaş Pantolon Siyah",
    categorySlug: "pantolon",
    description: "Bel lastikli, rahat kesim kumaş pantolon.",
    price: "699.00",
    color: "Siyah",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/timeless-bel-lastikli-siyah-kumas-pant-5eae-c.png",
    isPopular: true,
    isNew: false,
  },
  {
    slug: "cizgili-pijama-pantolon",
    name: "Çizgili Pijama Pantolon",
    categorySlug: "pantolon",
    description: "Yumuşak çizgili pijama pantolon.",
    price: "899.00",
    color: "Siyah",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/cizgili-pijama-pantolon-18f-65.jpg",
    isPopular: false,
    isNew: true,
  },
  {
    slug: "basic-slim-fit-ekru-tisort",
    name: "Basic Slim Fit Ekru Tişört",
    categorySlug: "tshirt",
    description: "Slim fit ekru basic tişört.",
    price: "249.90",
    oldPrice: "499.00",
    color: "Ekru",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/basic-slim-fit-tisort-9a-4dc.jpg",
    isPopular: true,
    isNew: false,
  },
  {
    slug: "basic-slim-fit-siyah-tisort",
    name: "Basic Slim Fit Siyah Tişört",
    categorySlug: "tshirt",
    description: "Slim fit siyah basic tişört.",
    price: "599.00",
    color: "Siyah",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/basic-slim-fit-siyah-tisort-c7-415.jpg",
    isPopular: true,
    isNew: false,
  },
  {
    slug: "basic-oversize-tisort-beyaz",
    name: "Basic Oversize Tişört Beyaz",
    categorySlug: "tshirt",
    description: "Oversize beyaz tişört.",
    price: "399.00",
    oldPrice: "699.00",
    color: "Beyaz",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/basic-beyaz-oversize-tisort-12e81b.jpg",
    isPopular: true,
    isNew: false,
  },
  {
    slug: "basic-oversize-tisort-siyah",
    name: "Basic Oversize Tişört Siyah",
    categorySlug: "tshirt",
    description: "Oversize siyah tişört.",
    price: "399.00",
    oldPrice: "449.00",
    color: "Siyah",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/basic-oversize-tisort-ac9e-d.jpg",
    isPopular: false,
    isNew: true,
  },
  {
    slug: "chill-cozy-gomlek-siyah",
    name: "Chill Cozy Relax Fit Gömlek Siyah",
    categorySlug: "gomlek",
    description: "Relax fit rahat gömlek.",
    price: "349.90",
    oldPrice: "699.00",
    color: "Siyah",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/basic-siyah-uzun-kollu-siyah-oversize--0fd682.jpg",
    isPopular: true,
    isNew: false,
  },
  {
    slug: "chill-cozy-gomlek-lacivert",
    name: "Chill Cozy Relax Fit Gömlek Lacivert",
    categorySlug: "gomlek",
    description: "Relax fit lacivert gömlek.",
    price: "599.00",
    oldPrice: "699.00",
    color: "Lacivert",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/chill-cozy-relax-fit-lacivert-gomlek-1-1126.jpg",
    isPopular: true,
    isNew: false,
  },
  {
    slug: "basic-keten-gomlek-beyaz",
    name: "Basic Keten Gömlek Beyaz",
    categorySlug: "gomlek",
    description: "Nefes alan keten gömlek.",
    price: "399.90",
    oldPrice: "799.00",
    color: "Beyaz",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/basic-beyaz-keten-gomlek-7220a-.jpg",
    isPopular: true,
    isNew: false,
  },
  {
    slug: "nakisli-bel-lastikli-sort-siyah",
    name: "Nakışlı Bel Lastikli Şort Siyah",
    categorySlug: "sort",
    description: "Bel lastikli nakışlı şort.",
    price: "399.00",
    oldPrice: "599.00",
    color: "Siyah",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/flaw-nakisli-bel-lastikli-sort-siyah-8d3-9b.jpg",
    isPopular: true,
    isNew: false,
  },
  {
    slug: "nakisli-bel-lastikli-sort-gri",
    name: "Nakışlı Bel Lastikli Şort Gri Melanj",
    categorySlug: "sort",
    description: "Bel lastikli nakışlı şort.",
    price: "399.00",
    oldPrice: "599.00",
    color: "Gri Melanj",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/flaw-nakisli-bel-lastikli-sort-gri-mel-b70bbb.jpg",
    isPopular: true,
    isNew: false,
  },
  {
    slug: "puffer-boxy-sweat-nepthi",
    name: "Puffer Nepthi Boxy Fit Sweat",
    categorySlug: "sweatshirt",
    description: "Boxy fit puffer sweatshirt.",
    price: "999.00",
    color: "Nepthi",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/basic-oversize-sweatshirt--9acc2.jpg",
    isPopular: false,
    isNew: true,
  },
  {
    slug: "puffer-boxy-sweat-butter",
    name: "Puffer Butter Yellow Boxy Fit Sweat",
    categorySlug: "sweatshirt",
    description: "Boxy fit sarı puffer sweatshirt.",
    price: "999.00",
    color: "Sarı",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/basic-oversize-sweatshirt-2bff1a.jpg",
    isPopular: false,
    isNew: true,
  },
  {
    slug: "puffer-boxy-sweat-navy",
    name: "Puffer Navy Blue Boxy Fit Sweat",
    categorySlug: "sweatshirt",
    description: "Boxy fit lacivert puffer sweatshirt.",
    price: "999.00",
    color: "Lacivert",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/basic-oversize-sweatshirt-bd70f3.jpg",
    isPopular: false,
    isNew: true,
  },
  {
    slug: "puffer-boxy-sweat-melange",
    name: "Puffer Melange Grey Boxy Fit Sweat",
    categorySlug: "sweatshirt",
    description: "Boxy fit gri puffer sweatshirt.",
    price: "999.00",
    color: "Gri Melanj",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/basic-oversize-sweatshirt-f4b48a.jpg",
    isPopular: false,
    isNew: true,
  },
  {
    slug: "green-half-zip-sweat",
    name: "Green Half Zip Sweat",
    categorySlug: "sweatshirt",
    description: "Yarım fermuarlı sweatshirt.",
    price: "999.00",
    color: "Yeşil",
    imageUrl:
      "https://static.ticimax.cloud/41607/Uploads/UrunResimleri/thumb/half-zip-basic-sweatshirt-e6-906.jpg",
    isPopular: true,
    isNew: true,
  },
];

async function downloadImage(url: string, dest: string): Promise<boolean> {
  const candidates = [url.replace("/thumb/", "/"), url];
  mkdirSync(dirname(dest), { recursive: true });
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!response.ok) {
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 1000) {
        continue;
      }
      writeFileSync(dest, buffer);
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

function discountPercent(price: string, oldPrice?: string): number | null {
  if (!oldPrice) {
    return null;
  }
  const current = Number(price);
  const previous = Number(oldPrice);
  if (!previous || previous <= current) {
    return null;
  }
  return Math.round((1 - current / previous) * 100);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    for (const item of PRODUCTS) {
      const category = await prisma.category.findUnique({
        where: { slug: item.categorySlug },
      });
      if (!category) {
        throw new Error(`Category missing: ${item.categorySlug}. Run npm run ensure-categories first.`);
      }

      const ext = item.imageUrl.toLowerCase().includes(".png") ? "png" : "jpg";
      const relative = `/products/demo/${item.slug}.${ext}`;
      const dest = resolve(process.cwd(), "public", relative.slice(1));
      const saved = await downloadImage(item.imageUrl, dest);
      const images = saved ? [relative] : ["/placeholders/tshirt.svg"];
      const discount = discountPercent(item.price, item.oldPrice);

      await prisma.product.upsert({
        where: { slug: item.slug },
        update: {
          name: item.name,
          description: item.description,
          price: new Prisma.Decimal(item.price),
          oldPrice: item.oldPrice ? new Prisma.Decimal(item.oldPrice) : null,
          discount,
          stock: 24,
          subcategory: category.name,
          images,
          colors: [item.color],
          sizes: CLOTHING_SIZES,
          isPopular: item.isPopular,
          isNew: item.isNew,
          isActive: true,
          categoryId: category.id,
        },
        create: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          price: new Prisma.Decimal(item.price),
          oldPrice: item.oldPrice ? new Prisma.Decimal(item.oldPrice) : null,
          discount,
          stock: 24,
          subcategory: category.name,
          images,
          colors: [item.color],
          sizes: CLOTHING_SIZES,
          isPopular: item.isPopular,
          isNew: item.isNew,
          isActive: true,
          categoryId: category.id,
        },
      });
      console.log(`Product ready: ${item.slug}`);
    }
    console.log(`Done. ${PRODUCTS.length} products upserted.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
