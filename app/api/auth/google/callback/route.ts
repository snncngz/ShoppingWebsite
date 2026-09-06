import { apiRoute } from "@/server/api/handler";
import { completeGoogleAuth } from "@/server/services/google-auth";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async (request) => {
  const url = request.nextUrl;
  return completeGoogleAuth({
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
    cookieState: request.cookies.get("lp_oauth_state")?.value,
  });
});
