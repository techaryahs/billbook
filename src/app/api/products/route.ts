import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const products = await prisma.product.findMany({
      where: {
        businessId: membership.businessId,
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                { barcode: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("GET products error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

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
    const { name, sku, barcode, hsnSac, description, unit, purchasePrice, sellingPrice, gstRate, stockQuantity, minStock, isActive } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Product name is required." },
        { status: 400 }
      );
    }

    // Wrap in transaction to add initial stock via InventoryTransaction if stockQuantity > 0
    const result = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          businessId: membership.businessId,
          name: name.trim(),
          sku: sku?.trim() || null,
          barcode: barcode?.trim() || null,
          hsnSac: hsnSac?.trim() || null,
          description: description?.trim() || null,
          unit: unit?.trim() || "PCS",
          purchasePrice: purchasePrice || 0,
          sellingPrice: sellingPrice || 0,
          gstRate: gstRate || 0,
          stockQuantity: stockQuantity || 0,
          minStock: minStock || 0,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      if (stockQuantity && Number(stockQuantity) > 0) {
        await tx.inventoryTransaction.create({
          data: {
            businessId: membership.businessId,
            productId: newProduct.id,
            type: "ADJUSTMENT",
            quantity: Number(stockQuantity),
            note: "Initial opening stock",
          },
        });
      }

      return newProduct;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully.",
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST products error:", error);
    
    const errorCode = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : null;
    if (errorCode === "P2002") {
      return NextResponse.json(
        { success: false, message: "A product with this SKU or Barcode already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
