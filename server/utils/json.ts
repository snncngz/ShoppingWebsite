import { badRequest } from "@/server/api/errors";

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    badRequest("Request body must be valid JSON");
  }
}

export function asJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    badRequest("Request body must be a JSON object");
  }

  return value as Record<string, unknown>;
}
