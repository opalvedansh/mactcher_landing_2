import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const supportRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  topic: z.string().min(2),
  message: z.string().min(10),
});

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const result = supportRequestSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Please check the form — we need a name, a valid email, and at least a couple of sentences.",
        errors: result.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    success: true,
    ticketId: `support_${crypto.randomUUID()}`,
    message: "Support request received. We will reply within 24 hours.",
    data: result.data,
  });
}
