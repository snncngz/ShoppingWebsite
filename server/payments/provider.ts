import { randomUUID } from "node:crypto";

import { createHmac } from "node:crypto";

import { getServerEnv, isProduction, paymentCurrency } from "@/server/config/env";

export type ProviderCheckoutInput = {
  orderId: string;
  amount: number;
  currency: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  items: {
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
  }[];
  ip: string;
  callbackUrl: string;
};

export type ProviderCheckoutResult = {
  provider: string;
  providerPaymentId: string;
  checkoutUrl: string;
};

export type IyzicoRetrieveResult = {
  paymentStatus: "SUCCESS" | "FAILURE" | "INIT_THREEDS" | "CALLBACK_THREEDS" | string;
  paymentId: string | null;
  paidPrice: string | null;
  basketId: string | null;
};

const PROVIDER_NAME = "IYZICO";

export function resolvePaymentProviderMode(): "iyzico" | "test" {
  const env = getServerEnv();
  if (env.paymentProvider === "test") {
    return "test";
  }
  if (env.iyzicoApiKey && env.iyzicoSecretKey) {
    return "iyzico";
  }
  if (isProduction() && env.paymentProvider === "iyzico") {
    throw new Error("IYZICO_API_KEY and IYZICO_SECRET_KEY are required");
  }
  return "test";
}

function splitName(fullName: string): { name: string; surname: string } {
  const parts = fullName.trim().split(/\s+/);
  const name = parts[0] || "VELORA";
  const surname = parts.slice(1).join(" ") || "Customer";
  return { name, surname };
}

function iyzicoAuthorization(
  uriPath: string,
  body: string,
  randomKey: string,
): string {
  const env = getServerEnv();
  const apiKey = env.iyzicoApiKey ?? "";
  const secretKey = env.iyzicoSecretKey ?? "";
  const payload = randomKey + uriPath + body;
  const signature = createHmac("sha256", secretKey).update(payload).digest("hex");
  const header = [`apiKey:${apiKey}`, `randomKey:${randomKey}`, `signature:${signature}`].join(
    "&",
  );
  return `IYZWSv2 ${Buffer.from(header).toString("base64")}`;
}

async function iyzicoPost<T>(uriPath: string, payload: Record<string, unknown>): Promise<T> {
  const env = getServerEnv();
  const body = JSON.stringify(payload);
  const randomKey = `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
  const response = await fetch(`${env.iyzicoBaseUrl}${uriPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: iyzicoAuthorization(uriPath, body, randomKey),
      "x-iyzi-rnd": randomKey,
    },
    body,
  });

  if (!response.ok) {
    throw new Error("Payment provider request failed");
  }

  return (await response.json()) as T;
}

export async function createProviderCheckout(
  input: ProviderCheckoutInput,
): Promise<ProviderCheckoutResult> {
  if (input.currency !== paymentCurrency()) {
    throw new Error("Unsupported payment currency");
  }

  if (resolvePaymentProviderMode() === "test") {
    return {
      provider: PROVIDER_NAME,
      providerPaymentId: `iyzico_test_${randomUUID()}`,
      checkoutUrl: `${getServerEnv().apiBaseUrl}/checkout/sonuc?orderId=${encodeURIComponent(input.orderId)}`,
    };
  }

  const { name, surname } = splitName(input.customer.name);
  const price = input.amount.toFixed(2);
  const uriPath = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
  const payload = {
    locale: "tr",
    conversationId: input.orderId,
    price,
    paidPrice: price,
    currency: "TRY",
    basketId: input.orderId,
    paymentGroup: "PRODUCT",
    callbackUrl: input.callbackUrl,
    enabledInstallments: [1],
    buyer: {
      id: input.customer.id,
      name,
      surname,
      gsmNumber: "+905350000000",
      email: input.customer.email,
      identityNumber: "11111111111",
      lastLoginDate: "2015-10-05 12:43:35",
      registrationDate: "2013-04-21 15:12:09",
      registrationAddress: "VELORA",
      ip: input.ip || "127.0.0.1",
      city: "Istanbul",
      country: "Turkey",
      zipCode: "34000",
    },
    shippingAddress: {
      contactName: input.customer.name,
      city: "Istanbul",
      country: "Turkey",
      address: "VELORA",
      zipCode: "34000",
    },
    billingAddress: {
      contactName: input.customer.name,
      city: "Istanbul",
      country: "Turkey",
      address: "VELORA",
      zipCode: "34000",
    },
    basketItems: input.items.map((item) => ({
      id: item.id,
      name: item.name,
      category1: item.category || "VELORA",
      itemType: "PHYSICAL",
      price: (item.price * item.quantity).toFixed(2),
    })),
  };

  const result = await iyzicoPost<{
    status?: string;
    token?: string;
    paymentPageUrl?: string;
    errorMessage?: string;
  }>(uriPath, payload);

  if (result.status !== "success" || !result.token) {
    throw new Error("Payment provider request failed");
  }

  return {
    provider: PROVIDER_NAME,
    providerPaymentId: result.token,
    checkoutUrl:
      result.paymentPageUrl ||
      `${getServerEnv().iyzicoBaseUrl.replace("api.", "")}/checkoutform?token=${result.token}`,
  };
}

export async function retrieveIyzicoCheckout(
  token: string,
): Promise<IyzicoRetrieveResult> {
  const result = await iyzicoPost<{
    paymentStatus?: string;
    paymentId?: string;
    paidPrice?: string;
    basketId?: string;
  }>("/payment/iyzipos/checkoutform/auth/ecom/detail", {
    locale: "tr",
    token,
  });

  return {
    paymentStatus: result.paymentStatus ?? "FAILURE",
    paymentId: result.paymentId ?? null,
    paidPrice: result.paidPrice ?? null,
    basketId: result.basketId ?? null,
  };
}
