import { badRequest } from "@/server/api/errors";
import { getPrisma } from "@/server/db/prisma";
import { assertRateLimit } from "@/server/security/http-guards";
import type { NewsletterSubscriberDto } from "@/types/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseSubscriberEmail(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    badRequest("email is required");
  }
  const email = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    badRequest("Enter a valid email address");
  }
  return email;
}

export function parseNewsletterSubscribe(body: Record<string, unknown>): {
  email: string;
} {
  return { email: parseSubscriberEmail(body.email) };
}

export async function subscribeNewsletter(email: string): Promise<{ ok: true }> {
  assertRateLimit(`newsletter:${email}`, 8, 15 * 60 * 1000);

  await getPrisma().newsletterSubscriber.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  return { ok: true };
}

export async function listNewsletterSubscribers(): Promise<NewsletterSubscriberDto[]> {
  const rows = await getPrisma().newsletterSubscriber.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 500,
  });

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
  }));
}
