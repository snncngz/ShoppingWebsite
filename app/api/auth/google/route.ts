import { apiRoute } from "@/server/api/handler";
import { startGoogleAuth } from "@/server/services/google-auth";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => startGoogleAuth());
