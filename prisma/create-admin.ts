import { PrismaClient } from "@prisma/client";

import { loadLocalEnv } from "./load-env";
import { upsertAdminUser } from "./upsert-admin";

loadLocalEnv();

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || "VELORA Admin";

if (!email || !password) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const prisma = new PrismaClient();

upsertAdminUser(prisma, { email, password, name })
  .then((user) => {
    console.log("Admin user ready:", user.email);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
