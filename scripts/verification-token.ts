type Envelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

type RequestFn = (
  path: string,
  init?: RequestInit & { cookie?: string },
) => Promise<{ status: number; body: Envelope<unknown>; cookie: string }>;

export function verificationTokenFrom(body: Envelope<unknown>): string {
  const data = body.data as
    | { pendingVerification?: boolean; verificationToken?: string }
    | undefined;
  if (!data?.pendingVerification) {
    throw new Error("register did not return pendingVerification");
  }
  if (!data.verificationToken) {
    throw new Error(
      "register did not return verificationToken (mail is configured; tests expect log-only mail)",
    );
  }
  return data.verificationToken;
}

export async function verifyFromRegister(
  request: RequestFn,
  registered: { body: Envelope<unknown> },
): Promise<{ status: number; body: Envelope<unknown>; cookie: string }> {
  const token = verificationTokenFrom(registered.body);
  const verified = await request("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  if (verified.status !== 200) {
    throw new Error(`verify-email expected 200, got ${verified.status}`);
  }
  return verified;
}
