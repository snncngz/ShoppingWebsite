import { badRequest } from "@/server/api/errors";
import { getPrisma } from "@/server/db/prisma";
import { logger } from "@/server/logging/logger";
import { sendMail } from "@/server/mail/mailer";
import { campaignEmailContent } from "@/server/mail/templates";
import { requireString } from "@/server/utils/validation";
import type { AdminMailSendResultDto } from "@/types/api";

const MAX_RECIPIENTS = 100;

export function parseAdminMailInput(body: Record<string, unknown>): {
  allUsers: boolean;
  allNewsletter: boolean;
  userIds: string[];
  newsletterIds: string[];
  subject: string;
  bodyText: string;
} {
  const subject = requireString(body, "subject", 160);
  const bodyText = requireString(body, "body", 8000);
  const userIds = Array.isArray(body.userIds)
    ? body.userIds.filter((id): id is string => typeof id === "string")
    : [];
  const newsletterIds = Array.isArray(body.newsletterIds)
    ? body.newsletterIds.filter((id): id is string => typeof id === "string")
    : [];

  return {
    allUsers: body.allUsers === true,
    allNewsletter: body.allNewsletter === true,
    userIds,
    newsletterIds,
    subject,
    bodyText,
  };
}

export async function sendAdminCampaignMail(input: {
  allUsers: boolean;
  allNewsletter: boolean;
  userIds: string[];
  newsletterIds: string[];
  subject: string;
  bodyText: string;
}): Promise<AdminMailSendResultDto> {
  const emails = new Set<string>();

  if (input.allUsers) {
    const users = await getPrisma().user.findMany({
      where: { emailVerifiedAt: { not: null } },
      select: { email: true },
      take: MAX_RECIPIENTS,
    });
    for (const user of users) {
      emails.add(user.email);
    }
  } else if (input.userIds.length > 0) {
    const users = await getPrisma().user.findMany({
      where: { id: { in: input.userIds }, emailVerifiedAt: { not: null } },
      select: { email: true },
    });
    for (const user of users) {
      emails.add(user.email);
    }
  }

  if (input.allNewsletter) {
    const subscribers = await getPrisma().newsletterSubscriber.findMany({
      select: { email: true },
      take: MAX_RECIPIENTS,
    });
    for (const subscriber of subscribers) {
      emails.add(subscriber.email);
    }
  } else if (input.newsletterIds.length > 0) {
    const subscribers = await getPrisma().newsletterSubscriber.findMany({
      where: { id: { in: input.newsletterIds } },
      select: { email: true },
    });
    for (const subscriber of subscribers) {
      emails.add(subscriber.email);
    }
  }

  const recipients = [...emails].slice(0, MAX_RECIPIENTS);
  if (recipients.length === 0) {
    badRequest("No recipients selected");
  }

  const content = campaignEmailContent({
    subject: input.subject,
    body: input.bodyText,
  });

  let sent = 0;
  let failed = 0;
  for (const to of recipients) {
    try {
      await sendMail({
        to,
        subject: content.subject,
        text: content.text,
        html: content.html,
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      logger.error("campaign email failed", {
        to,
        reason: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  return {
    sent,
    failed,
    skipped: Math.max(0, emails.size - recipients.length),
  };
}
