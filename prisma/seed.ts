import { Prisma, PrismaClient, OrderStatus, UserRole } from "@prisma/client";

export const DEV_SEED = {
  userEmail: "db-seed@velora.test",
  userName: "VELORA DB Seed",
  categorySlug: "db-seed-category",
  categoryName: "DB Seed Category",
  productSlug: "db-seed-product",
  productName: "DB Seed Product",
} as const;

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEV_SEED.userEmail },
    update: { name: DEV_SEED.userName, role: UserRole.CUSTOMER },
    create: {
      name: DEV_SEED.userName,
      email: DEV_SEED.userEmail,
      passwordHash: "seed-placeholder-not-a-hash",
      role: UserRole.CUSTOMER,
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: DEV_SEED.categorySlug },
    update: {
      name: DEV_SEED.categoryName,
      description: "Development seed category. Not used by the storefront.",
      isActive: true,
    },
    create: {
      name: DEV_SEED.categoryName,
      slug: DEV_SEED.categorySlug,
      description: "Development seed category. Not used by the storefront.",
      isActive: true,
    },
  });

  const product = await prisma.product.upsert({
    where: { slug: DEV_SEED.productSlug },
    update: {
      name: DEV_SEED.productName,
      description: "Development seed product. Not used by the storefront.",
      price: new Prisma.Decimal("1000.00"),
      stock: 8,
      subcategory: "Seed",
      images: ["/placeholders/tshirt.svg"],
      colors: ["Siyah"],
      sizes: ["M"],
      isActive: true,
      categoryId: category.id,
    },
    create: {
      name: DEV_SEED.productName,
      slug: DEV_SEED.productSlug,
      description: "Development seed product. Not used by the storefront.",
      price: new Prisma.Decimal("1000.00"),
      stock: 8,
      subcategory: "Seed",
      images: ["/placeholders/tshirt.svg"],
      colors: ["Siyah"],
      sizes: ["M"],
      isActive: true,
      categoryId: category.id,
    },
  });

  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: { cartId: cart.id, productId: product.id },
    },
    update: { quantity: 1 },
    create: { cartId: cart.id, productId: product.id, quantity: 1 },
  });

  const wishlist = await prisma.wishlist.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  await prisma.wishlistItem.upsert({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId: product.id,
      },
    },
    update: {},
    create: { wishlistId: wishlist.id, productId: product.id },
  });

  const existingOrder = await prisma.order.findFirst({
    where: { userId: user.id },
    include: { items: true },
  });

  if (!existingOrder) {
    await prisma.order.create({
      data: {
        userId: user.id,
        status: OrderStatus.PENDING,
        total: new Prisma.Decimal("1000.00"),
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            unitPrice: new Prisma.Decimal("1000.00"),
          },
        },
      },
    });
  }

  console.log("Seed complete:", {
    user: user.email,
    category: category.slug,
    product: product.slug,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
