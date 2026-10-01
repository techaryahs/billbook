import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { InventoryTransactionType } from "@/generated/prisma/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
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

    // Fetch Products
    const products = await prisma.product.findMany({
      where: { businessId: membership.businessId, isActive: true },
    });

    // Fetch Inventory Movements
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { businessId: membership.businessId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to recent movements
    });

    const mappedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || "",
      category: p.description || "General", // Using description as category
      stock: Number(p.stockQuantity),
      purchasePrice: Number(p.purchasePrice),
      sellingPrice: Number(p.sellingPrice),
      minimumStock: Number(p.minStock),
    }));

    const mappedMovements = transactions.map((t) => {
      let type: "IN" | "OUT" = "IN";
      if (t.type === "SALE" || t.type === "RETURN_OUT") {
        type = "OUT";
      } else if (t.type === "ADJUSTMENT") {
        type = Number(t.quantity) >= 0 ? "IN" : "OUT";
      }

      let reference = t.referenceType || t.type;
      if (t.type === "PURCHASE") {
        reference = "PUR-" + (t.referenceId ? t.referenceId.slice(-4).toUpperCase() : "");
      } else if (t.type === "SALE") {
        reference = "INV-" + (t.referenceId ? t.referenceId.slice(-4).toUpperCase() : "");
      } else if (t.type === "ADJUSTMENT") {
        reference = "ADJ-" + t.id.slice(-4).toUpperCase();
      }

      return {
        id: t.id,
        product: t.product.name,
        type,
        quantity: Math.abs(Number(t.quantity)),
        date: t.createdAt.toISOString(),
        reference,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        products: mappedProducts,
        movements: mappedMovements,
      },
    });
  } catch (error) {
    console.error("GET inventory error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch inventory",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
