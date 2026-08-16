import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";

import { badRequest, conflict, notFound, unauthorized } from "@/server/api/errors";
import {
  getServerEnv,
  paymentCurrency,
  requirePaymentWebhookSecret,
} from "@/server/config/env";
import { getPrisma } from "@/server/db/prisma";
import { decimalToNumber } from "@/server/dto/catalog";
import {
  createProviderCheckout,
  retrieveIyzicoCheckout,
} from "@/server/payments/provider";
import {
  isValidPaymentSignature,
  PAYMENT_SIGNATURE_HEADER,
} from "@/server/payments/signature";
import { requireId, requireString } from "@/server/utils/validation";
import type {
  PaymentCreateDto,
  PaymentDto,
  PaymentStatusDto,
} from "@/types/api";

const PROVIDER = "IYZICO";

const SUCCESS_EVENTS = new Set(["payment.succeeded", "PAYMENT_SUCCESS"]);
const FAILURE_EVENTS = new Set(["payment.failed", "PAYMENT_FAILURE"]);
const CANCEL_EVENTS = new Set(["payment.cancelled", "PAYMENT_CANCELLED"]);

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: { product: { select: { name: true } } };
    };
  };
}>;

function logPayment(
  event: string,
  fields: {
    orderId?: string;
    paymentId?: string;
    provider?: string;
    status?: string;
    eventId?: string;
  },
) {
  console.info("[velora-payment]", event, fields);
}

function toPaymentDto(payment: {
  id: string;
  orderId: string;
  provider: string;
  status: PaymentStatus;
  amount: Prisma.Decimal;
  currency: string;
  checkoutUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PaymentDto {
  return {
    id: payment.id,
    orderId: payment.orderId,
    provider: payment.provider,
    status: payment.status,
    amount: decimalToNumber(payment.amount),
    currency: payment.currency,
    checkoutUrl: payment.checkoutUrl,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

export function parseCreatePayment(body: Record<string, unknown>): {
  orderId: string;
} {
  return { orderId: requireString(body, "orderId") };
}

export function amountFromOrderItems(order: {
  items: { unitPrice: Prisma.Decimal; quantity: number }[];
  total: Prisma.Decimal;
}): Prisma.Decimal {
  let amount = new Prisma.Decimal(0);
  for (const item of order.items) {
    amount = amount.add(item.unitPrice.mul(item.quantity));
  }
  if (!amount.eq(order.total)) {
    badRequest("Order total does not match item snapshot");
  }
  return amount;
}

async function requireOwnedOrder(
  userId: string,
  orderId: string,
): Promise<OrderWithItems> {
  const order = await getPrisma().order.findUnique({
    where: { id: requireId(orderId) },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
    },
  });

  if (!order || order.userId !== userId) {
    notFound("Order not found");
  }

  return order;
}

export async function createPayment(
  userId: string,
  orderId: string,
  requestMeta: { ip: string },
): Promise<PaymentCreateDto> {
  const order = await requireOwnedOrder(userId, orderId);

  if (order.status === OrderStatus.CANCELLED) {
    conflict("Order is cancelled");
  }
  if (order.status === OrderStatus.PAID) {
    conflict("Order is already paid");
  }
  if (order.status !== OrderStatus.PENDING) {
    conflict("Order is not payable");
  }

  const existingSuccess = await getPrisma().payment.findFirst({
    where: { orderId: order.id, status: PaymentStatus.SUCCEEDED },
  });
  if (existingSuccess) {
    conflict("Order already has a successful payment");
  }

  const openPayment = await getPrisma().payment.findFirst({
    where: {
      orderId: order.id,
      status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (openPayment) {
    return {
      ...toPaymentDto(openPayment),
      orderStatus: order.status,
    };
  }

  const amount = amountFromOrderItems(order);
  const currency = paymentCurrency();
  const user = await getPrisma().user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  const checkout = await createProviderCheckout({
    orderId: order.id,
    amount: decimalToNumber(amount),
    currency,
    customer: user,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.product.name,
      category: "VELORA",
      price: decimalToNumber(item.unitPrice),
      quantity: item.quantity,
    })),
    ip: requestMeta.ip,
    callbackUrl: `${getServerEnv().apiBaseUrl}/api/payments/iyzico/callback`,
  });

  try {
    const payment = await getPrisma().payment.create({
      data: {
        orderId: order.id,
        provider: checkout.provider,
        providerPaymentId: checkout.providerPaymentId,
        status: PaymentStatus.PENDING,
        amount,
        currency,
        checkoutUrl: checkout.checkoutUrl,
      },
    });

    logPayment("created", {
      orderId: order.id,
      paymentId: payment.id,
      provider: payment.provider,
      status: payment.status,
    });

    return {
      ...toPaymentDto(payment),
      orderStatus: order.status,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      conflict("Duplicate payment");
    }
    throw error;
  }
}

export async function getPaymentForUser(
  userId: string,
  paymentId: string,
): Promise<PaymentDto> {
  const payment = await getPrisma().payment.findUnique({
    where: { id: requireId(paymentId) },
    include: { order: { select: { userId: true } } },
  });

  if (!payment || payment.order.userId !== userId) {
    notFound("Payment not found");
  }

  return toPaymentDto(payment);
}

export async function listPaymentsForOrder(
  userId: string,
  orderId: string,
): Promise<PaymentDto[]> {
  const order = await requireOwnedOrder(userId, orderId);
  const payments = await getPrisma().payment.findMany({
    where: { orderId: order.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return payments.map(toPaymentDto);
}

export function toAdminPaymentDtos(
  payments: Parameters<typeof toPaymentDto>[0][],
): PaymentDto[] {
  return payments.map(toPaymentDto);
}

function eventToStatus(eventType: string): PaymentStatus | null {
  if (SUCCESS_EVENTS.has(eventType)) {
    return PaymentStatus.SUCCEEDED;
  }
  if (FAILURE_EVENTS.has(eventType)) {
    return PaymentStatus.FAILED;
  }
  if (CANCEL_EVENTS.has(eventType)) {
    return PaymentStatus.CANCELLED;
  }
  return null;
}

export async function applyVerifiedPaymentResult(input: {
  providerPaymentId: string;
  eventId: string;
  eventType: string;
}): Promise<{ ignored: boolean; payment: PaymentDto | null }> {
  const nextStatus = eventToStatus(input.eventType);
  if (!nextStatus) {
    logPayment("ignored-event", {
      eventId: input.eventId,
      status: input.eventType,
      provider: PROVIDER,
    });
    return { ignored: true, payment: null };
  }

  return getPrisma().$transaction(async (tx) => {
    const existingEvent = await tx.paymentEvent.findUnique({
      where: { eventId: input.eventId },
    });
    if (existingEvent) {
      const payment = await tx.payment.findUnique({
        where: { id: existingEvent.paymentId },
      });
      logPayment("duplicate-event", {
        eventId: input.eventId,
        paymentId: existingEvent.paymentId,
        provider: PROVIDER,
      });
      return {
        ignored: true,
        payment: payment ? toPaymentDto(payment) : null,
      };
    }

    const payment = await tx.payment.findUnique({
      where: { providerPaymentId: input.providerPaymentId },
      include: { order: true },
    });
    if (!payment) {
      notFound("Payment not found");
    }

    try {
      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventId: input.eventId,
          eventType: input.eventType,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        logPayment("duplicate-event", {
          eventId: input.eventId,
          paymentId: payment.id,
          provider: PROVIDER,
        });
        return { ignored: true, payment: toPaymentDto(payment) };
      }
      throw error;
    }

    if (payment.status === PaymentStatus.SUCCEEDED) {
      return { ignored: true, payment: toPaymentDto(payment) };
    }

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: { status: nextStatus },
    });

    if (
      nextStatus === PaymentStatus.SUCCEEDED &&
      payment.order.status === OrderStatus.PENDING
    ) {
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.PAID },
      });
    }

    logPayment("applied", {
      orderId: payment.orderId,
      paymentId: payment.id,
      provider: payment.provider,
      status: nextStatus,
      eventId: input.eventId,
    });

    return { ignored: false, payment: toPaymentDto(updated) };
  });
}

export async function handlePaymentWebhook(
  rawBody: string,
  signature: string | null,
): Promise<{ ignored: boolean }> {
  const secret = requirePaymentWebhookSecret();
  if (!isValidPaymentSignature(rawBody, signature, secret)) {
    unauthorized("Invalid payment signature");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    badRequest("Webhook body must be valid JSON");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    badRequest("Webhook body must be a JSON object");
  }

  const body = parsed as Record<string, unknown>;
  const eventId = body.eventId;
  const eventType = body.eventType;
  const providerPaymentId = body.providerPaymentId;

  if (typeof eventId !== "string" || eventId.trim().length === 0) {
    badRequest("eventId is required");
  }
  if (typeof eventType !== "string" || eventType.trim().length === 0) {
    badRequest("eventType is required");
  }
  if (
    typeof providerPaymentId !== "string" ||
    providerPaymentId.trim().length === 0
  ) {
    badRequest("providerPaymentId is required");
  }

  const result = await applyVerifiedPaymentResult({
    eventId: eventId.trim(),
    eventType: eventType.trim(),
    providerPaymentId: providerPaymentId.trim(),
  });

  return { ignored: result.ignored };
}

export async function handleIyzicoCallback(token: string): Promise<{
  orderId: string;
  status: PaymentStatusDto;
}> {
  const retrieved = await retrieveIyzicoCheckout(token);
  const payment = await getPrisma().payment.findUnique({
    where: { providerPaymentId: token },
  });
  if (!payment) {
    notFound("Payment not found");
  }

  const paidPrice = retrieved.paidPrice
    ? new Prisma.Decimal(retrieved.paidPrice)
    : null;
  if (
    retrieved.paymentStatus === "SUCCESS" &&
    retrieved.basketId === payment.orderId &&
    paidPrice &&
    paidPrice.eq(payment.amount)
  ) {
    await applyVerifiedPaymentResult({
      providerPaymentId: token,
      eventId: `iyzico-callback-${token}`,
      eventType: "payment.succeeded",
    });
    return { orderId: payment.orderId, status: "SUCCEEDED" };
  }

  await applyVerifiedPaymentResult({
    providerPaymentId: token,
    eventId: `iyzico-callback-fail-${token}`,
    eventType: "payment.failed",
  });
  return { orderId: payment.orderId, status: "FAILED" };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "127.0.0.1";
  }
  return "127.0.0.1";
}

export { PAYMENT_SIGNATURE_HEADER };
export type { PaymentStatusDto };
