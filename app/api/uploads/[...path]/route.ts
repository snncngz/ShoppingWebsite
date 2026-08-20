import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { apiRoute } from "@/server/api/handler";
import { readProductUpload } from "@/server/services/uploads";

type PathContext = {
  params: Promise<{ path: string[] }>;
};

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (_request: NextRequest, context: PathContext) => {
  const segments = await context.params;
  const parts = segments.path ?? [];

  if (parts.length !== 2 || parts[0] !== "products") {
    return NextResponse.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Image not found" },
      },
      { status: 404 },
    );
  }

  const file = await readProductUpload(parts[1]);
  return new NextResponse(new Uint8Array(file.bytes), {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
