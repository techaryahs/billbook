import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        businessId: membership.businessId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? existingProduct.name,
        sku: body.sku?.trim() ?? existingProduct.sku,
        barcode: body.barcode?.trim() ?? existingProduct.barcode,
        hsnSac: body.hsnSac?.trim() ?? existingProduct.hsnSac,
        description: body.description?.trim() ?? existingProduct.description,
        unit: body.unit?.trim() ?? existingProduct.unit,
        purchasePrice: body.purchasePrice ?? existingProduct.purchasePrice,
        sellingPrice: body.sellingPrice ?? existingProduct.sellingPrice,
        gstRate: body.gstRate ?? existingProduct.gstRate,
        minStock: body.minStock ?? existingProduct.minStock,
        isActive: body.isActive ?? existingProduct.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("PATCH product error:", error);
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
        message: "Failed to update product.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        businessId: membership.businessId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    // Soft delete to preserve historical transactions (invoices, purchases)
    await prisma.product.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE product error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete product.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
