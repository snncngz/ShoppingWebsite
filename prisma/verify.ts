import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VERIFY = {
  categorySlug: "db-verify-category",
  productSlug: "db-verify-product",
  snapshotSlug: "db-verify-snapshot-product",
  duplicateEmail: "db-verify-duplicate@velora.test",
} as const;

let failed = 0;

function pass(name: string) {
  console.log(`PASS  ${name}`);
}

function fail(name: string, error: unknown) {
  failed += 1;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`FAIL  ${name}: ${message}`);
}

function isPrismaCode(error: unknown, code: string): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === code,
  );
}

function isRestrictError(error: unknown): boolean {
  return isPrismaCode(error, "P2003") || isPrismaCode(error, "P2014");
}

async function expectReject(
  codes: string | string[],
  action: () => Promise<unknown>,
) {
  const expected = Array.isArray(codes) ? codes : [codes];
  try {
    await action();
    throw new Error(`Expected Prisma error ${expected.join(" or ")}`);
  } catch (error) {
    if (expected.some((code) => isPrismaCode(error, code))) {
      return;
    }
    if (expected.includes("P2003") && isRestrictError(error)) {
      return;
    }
    throw error;
  }
}

async function cleanupVerifyRows() {
  const user = await prisma.user.findUnique({
    where: { email: VERIFY.duplicateEmail },
  });

  if (user) {
    await prisma.order.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }

  await prisma.product.deleteMany({
    where: { slug: { in: [VERIFY.productSlug, VERIFY.snapshotSlug] } },
  });
  await prisma.category.deleteMany({
    where: { slug: VERIFY.categorySlug },
  });
}

async function testCategoryCrud() {
  const created = await prisma.category.create({
    data: {
      name: "Verify Category",
      slug: VERIFY.categorySlug,
      description: "temporary",
    },
  });
  const read = await prisma.category.findUniqueOrThrow({
    where: { id: created.id },
  });
  const updated = await prisma.category.update({
    where: { id: read.id },
    data: { description: "updated" },
  });
  if (updated.description !== "updated") {
    throw new Error("Category update did not persist");
  }
  await prisma.category.delete({ where: { id: created.id } });
  const gone = await prisma.category.findUnique({ where: { id: created.id } });
  if (gone) {
    throw new Error("Category delete did not persist");
  }
}

async function testProductCrud() {
  const category = await prisma.category.create({
    data: {
      name: "Verify Category",
      slug: VERIFY.categorySlug,
    },
  });
  const created = await prisma.product.create({
    data: {
      name: "Verify Product",
      slug: VERIFY.productSlug,
      description: "temporary",
      price: new Prisma.Decimal("250.00"),
      stock: 3,
      categoryId: category.id,
      images: ["/placeholders/tshirt.svg"],
      colors: ["Siyah"],
      sizes: ["M"],
    },
  });
  const read = await prisma.product.findUniqueOrThrow({
    where: { slug: VERIFY.productSlug },
  });
  const updated = await prisma.product.update({
    where: { id: read.id },
    data: { stock: 2, isActive: false },
  });
  if (updated.stock !== 2 || updated.isActive) {
    throw new Error("Product update did not persist");
  }
  await prisma.product.delete({ where: { id: created.id } });
  await prisma.category.delete({ where: { id: category.id } });
}

async function testRelationsAndSnapshot() {
  const user = await prisma.user.create({
    data: {
      name: "Verify User",
      email: VERIFY.duplicateEmail,
      passwordHash: "seed-placeholder-not-a-hash",
    },
  });
  const category = await prisma.category.create({
    data: { name: "Verify Category", slug: VERIFY.categorySlug },
  });
  const product = await prisma.product.create({
    data: {
      name: "Snapshot Product",
      slug: VERIFY.snapshotSlug,
      description: "price snapshot",
      price: new Prisma.Decimal("1000.00"),
      stock: 5,
      categoryId: category.id,
      images: ["/placeholders/tshirt.svg"],
      colors: ["Siyah"],
      sizes: ["M"],
    },
  });

  const cart = await prisma.cart.create({ data: { userId: user.id } });
  await prisma.cartItem.create({
    data: { cartId: cart.id, productId: product.id, quantity: 1 },
  });
  const wishlist = await prisma.wishlist.create({ data: { userId: user.id } });
  await prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, productId: product.id },
  });
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      total: new Prisma.Decimal("1000.00"),
      items: {
        create: {
          productId: product.id,
          quantity: 1,
          unitPrice: new Prisma.Decimal("1000.00"),
        },
      },
    },
    include: { items: true },
  });

  const graph = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: {
      cart: { include: { items: true } },
      wishlist: { include: { items: true } },
      orders: { include: { items: true } },
    },
  });

  if (!graph.cart || graph.cart.items.length !== 1) {
    throw new Error("User → Cart → CartItem relation missing");
  }
  if (!graph.wishlist || graph.wishlist.items.length !== 1) {
    throw new Error("User → Wishlist → WishlistItem relation missing");
  }
  if (graph.orders.length !== 1 || graph.orders[0].items.length !== 1) {
    throw new Error("User → Order → OrderItem relation missing");
  }

  const categoryWithProduct = await prisma.category.findUniqueOrThrow({
    where: { id: category.id },
    include: { products: true },
  });
  if (categoryWithProduct.products.length !== 1) {
    throw new Error("Category → Product relation missing");
  }

  await prisma.product.update({
    where: { id: product.id },
    data: { price: new Prisma.Decimal("1500.00") },
  });
  const item = await prisma.orderItem.findUniqueOrThrow({
    where: { id: order.items[0].id },
  });
  if (!item.unitPrice.equals(new Prisma.Decimal("1000"))) {
    throw new Error(`unitPrice changed after product price update: ${item.unitPrice}`);
  }

  await expectReject(["P2003", "P2014"], () =>
    prisma.product.delete({ where: { id: product.id } }),
  );
  await expectReject(["P2003", "P2014"], () =>
    prisma.category.delete({ where: { id: category.id } }),
  );

  return { userId: user.id, productId: product.id, categoryId: category.id };
}

async function testConstraints(productId: string, userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
  });
  const cart = await prisma.cart.findUniqueOrThrow({
    where: { userId: user.id },
  });
  const wishlist = await prisma.wishlist.findUniqueOrThrow({
    where: { userId: user.id },
  });

  await expectReject("P2002", () =>
    prisma.user.create({
      data: {
        name: "Dup",
        email: user.email,
        passwordHash: "x",
      },
    }),
  );
  await expectReject("P2002", () =>
    prisma.category.create({
      data: { name: "Dup", slug: VERIFY.categorySlug },
    }),
  );
  await expectReject("P2002", () =>
    prisma.product.create({
      data: {
        name: "Dup",
        slug: product.slug,
        description: "dup",
        price: new Prisma.Decimal("1.00"),
        categoryId: product.categoryId,
      },
    }),
  );
  await expectReject("P2002", () =>
    prisma.cartItem.create({
      data: { cartId: cart.id, productId: product.id, quantity: 2 },
    }),
  );
  await expectReject("P2002", () =>
    prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productId: product.id },
    }),
  );
}

async function main() {
  await cleanupVerifyRows();

  try {
    await testCategoryCrud();
    pass("Category CRUD");
  } catch (error) {
    fail("Category CRUD", error);
  }

  try {
    await testProductCrud();
    pass("Product CRUD");
  } catch (error) {
    fail("Product CRUD", error);
  }

  let ids: { userId: string; productId: string; categoryId: string } | undefined;
  try {
    ids = await testRelationsAndSnapshot();
    pass("Relations");
    pass("OrderItem unitPrice snapshot");
    pass("Product delete restricted while OrderItem exists");
    pass("Category delete restricted while Product exists");
  } catch (error) {
    fail("Relations / snapshot / restrict", error);
  }

  if (ids) {
    try {
      await testConstraints(ids.productId, ids.userId);
      pass("Unique constraints");
    } catch (error) {
      fail("Unique constraints", error);
    }
  }

  await cleanupVerifyRows();

  if (failed > 0) {
    process.exit(1);
  }

  console.log("Database verification complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
