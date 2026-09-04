import nodemailer from "nodemailer";

import { BRAND_NAME } from "@/lib/constants";
import { getServerEnv, isProduction } from "@/server/config/env";
import { logger } from "@/server/logging/logger";

export type OutboundMail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function mailFrom(): string {
  return getServerEnv().mailFrom ?? `${BRAND_NAME} <no-reply@localhost>`;
}

export function isMailConfigured(): boolean {
  const env = getServerEnv();
  if (env.resendApiKey) {
    return true;
  }
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPassword);
}

async function sendWithResend(mail: OutboundMail, apiKey: string): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: mailFrom(),
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend request failed (${response.status})`);
  }
}

async function sendWithSmtp(mail: OutboundMail): Promise<void> {
  const env = getServerEnv();
  const port = env.smtpPort;
  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port,
    secure: port === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPassword,
    },
  });

  await transporter.sendMail({
    from: mailFrom(),
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
}

export async function sendMail(mail: OutboundMail): Promise<void> {
  const env = getServerEnv();

  if (env.resendApiKey) {
    await sendWithResend(mail, env.resendApiKey);
    logger.info("verification email sent", { provider: "resend" });
    return;
  }

  if (env.smtpHost && env.smtpUser && env.smtpPassword) {
    await sendWithSmtp(mail);
    logger.info("verification email sent", { provider: "smtp" });
    return;
  }

  if (isProduction() && !env.apiBaseUrl.includes("localhost") && !env.apiBaseUrl.includes("127.0.0.1")) {
    throw new Error("Mail is not configured");
  }

  logger.warn("mail not configured; verification email logged only");
  console.info(`[mail:dev] to=${mail.to}\n${mail.text}`);
}
