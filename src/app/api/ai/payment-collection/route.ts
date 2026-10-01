import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getPaymentCollectionData } from "@/lib/ai/payment-collection-data";

export const runtime = "nodejs";

export async function GET() {
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

    const data = await getPaymentCollectionData(membership.businessId);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error("=================================");
    console.error("PAYMENT COLLECTION ERROR");
    console.error(error);
    console.error("MESSAGE:", errorMessage);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load payment collection data.",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
