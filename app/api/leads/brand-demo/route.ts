import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const brandDemoSchema = z.object({
  fullName: z.string().min(2),
  workEmail: z.string().email(),
  companyName: z.string().min(2),
  companySize: z.string().min(1),
  message: z.string().min(10),
});

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const result = brandDemoSchema.safeParse(payload);

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
    leadId: `demo_${crypto.randomUUID()}`,
    message: "Thanks! Our team will reach out within 1 business day.",
    data: result.data,
  });
}
