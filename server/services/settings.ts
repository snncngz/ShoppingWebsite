import { getPrisma } from "@/server/db/prisma";
import { sendMail } from "@/server/mail/mailer";
import { logger } from "@/server/logging/logger";
import {
  DEFAULT_WELCOME_BODY,
  DEFAULT_WELCOME_SUBJECT,
  welcomeEmailContent,
} from "@/server/mail/templates";
import { requireString } from "@/server/utils/validation";
import type { WelcomeSettingsDto } from "@/types/api";

const SETTING_ID = "site";

function toDto(row: {
  welcomeSubject: string;
  welcomeBody: string;
  updatedAt: Date;
}): WelcomeSettingsDto {
  return {
    welcomeSubject: row.welcomeSubject || DEFAULT_WELCOME_SUBJECT,
    welcomeBody: row.welcomeBody || DEFAULT_WELCOME_BODY,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getWelcomeSettings(): Promise<WelcomeSettingsDto> {
  const prisma = getPrisma();
  const existing = await prisma.siteSetting.findUnique({
    where: { id: SETTING_ID },
  });
  if (existing) {
    return toDto(existing);
  }

  const created = await prisma.siteSetting.create({
    data: {
      id: SETTING_ID,
      welcomeSubject: DEFAULT_WELCOME_SUBJECT,
      welcomeBody: DEFAULT_WELCOME_BODY,
    },
  });
  return toDto(created);
}

export function parseWelcomeSettingsInput(body: Record<string, unknown>): {
  welcomeSubject: string;
  welcomeBody: string;
} {
  return {
    welcomeSubject: requireString(body, "welcomeSubject", 160),
    welcomeBody: requireString(body, "welcomeBody", 8000),
  };
}

export async function updateWelcomeSettings(input: {
  welcomeSubject: string;
  welcomeBody: string;
}): Promise<WelcomeSettingsDto> {
  const row = await getPrisma().siteSetting.upsert({
    where: { id: SETTING_ID },
    create: {
      id: SETTING_ID,
      welcomeSubject: input.welcomeSubject,
      welcomeBody: input.welcomeBody,
    },
    update: {
      welcomeSubject: input.welcomeSubject,
      welcomeBody: input.welcomeBody,
    },
  });
  return toDto(row);
}

export async function sendWelcomeEmail(user: {
  name: string;
  email: string;
}): Promise<void> {
  try {
    const settings = await getWelcomeSettings();
    const content = welcomeEmailContent({
      name: user.name,
      email: user.email,
      subject: settings.welcomeSubject,
      body: settings.welcomeBody,
    });
    await sendMail({
      to: user.email,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
  } catch (error: unknown) {
    logger.error("welcome email failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
  }
}
