import { requireAdmin } from "@/server/auth/authorization";
import { apiRoute } from "@/server/api/handler";
import { HttpStatus, jsonSuccess } from "@/server/api/http";
import { badRequest } from "@/server/api/errors";
import { saveProductImage } from "@/server/services/uploads";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  await requireAdmin();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    badRequest("Multipart form data is required");
  }

  const entry = form.get("file");
  if (!(entry instanceof File)) {
    badRequest("file is required");
  }

  return jsonSuccess(await saveProductImage(entry), HttpStatus.CREATED);
});
