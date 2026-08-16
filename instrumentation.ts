import type { Instrumentation } from "next";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { registerNode } = await import("./server/runtime/register-node");
  await registerNode();
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { reportRequestError } = await import("./server/runtime/register-node");
  await reportRequestError(err, request, context);
};
