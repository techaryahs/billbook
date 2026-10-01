import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("aryahs_session")?.value;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    const membership = await prisma.businessMember.findFirst({
      where: { userId },
      select: { businessId: true },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, message: "No business is associated with this account." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { productId, quantity, note } = body;

    if (!productId || typeof quantity !== "number") {
      return NextResponse.json(
        { success: false, message: "Product ID and quantity are required." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: productId, businessId: membership.businessId },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stockQuantity: {
            increment: quantity, // quantity can be negative for deduction
          },
        },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          businessId: membership.businessId,
          productId,
          type: "ADJUSTMENT",
          quantity,
          referenceType: "MANUAL_ADJUST",
          note: note || "Manual stock adjustment",
        },
      });

      return { product: updatedProduct, transaction };
    });

    return NextResponse.json({
      success: true,
      message: "Inventory adjusted successfully.",
      data: result,
    });
  } catch (error) {
    console.error("POST inventory adjust error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to adjust inventory.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
