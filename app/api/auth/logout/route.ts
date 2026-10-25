import { NextResponse } from "next/server";
import {
  buildClearSessionCookieHeader,
  destroySessionFromRequest,
} from "@/lib/auth-session";

export async function POST(request: Request) {
  await destroySessionFromRequest(request);

  return NextResponse.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": buildClearSessionCookieHeader(),
      },
    },
  );
}
