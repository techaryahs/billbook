import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { answerBusinessQuestion } from "@/lib/ai/business-assistant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const userId = cookieStore.get("aryahs_session")?.value;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const membership = await prisma.businessMember.findFirst({
      where: {
        userId,
      },
      select: {
        businessId: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: "No business is associated with this account.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a question.",
        },
        { status: 400 },
      );
    }

    const now = new Date();

    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const result = await answerBusinessQuestion(message, {
      businessId: membership.businessId,
      from: startDate,
      to: endDate,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error("=================================");
    console.error("BUSINESS ASSISTANT ERROR");
    console.error(error);
    console.error("MESSAGE:", errorMessage);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process business question.",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
