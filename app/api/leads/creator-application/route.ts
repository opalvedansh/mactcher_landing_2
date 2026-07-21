import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const creatorApplicationSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  handle: z.string().min(2),
  primaryPlatform: z.string().min(2),
  audienceSize: z.string().min(1),
  note: z.string().min(10),
});

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const result = creatorApplicationSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        errors: result.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    success: true,
    applicationId: `creator_${crypto.randomUUID()}`,
    message: "Application received. We will review it shortly.",
    data: result.data,
  });
}
