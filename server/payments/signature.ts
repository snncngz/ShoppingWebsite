import { createHmac, timingSafeEqual } from "node:crypto";

export const PAYMENT_SIGNATURE_HEADER = "x-payment-signature";

export function signPaymentPayload(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function isValidPaymentSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) {
    return false;
  }

  const expected = signPaymentPayload(rawBody, secret);
  const provided = signature.trim().toLowerCase();
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
