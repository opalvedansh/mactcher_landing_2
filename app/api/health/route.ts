import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    service: "matchr-landing-page",
    status: "ok",
  });
}
