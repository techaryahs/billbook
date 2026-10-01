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

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        businessId: membership.businessId,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found." },
        { status: 404 }
      );
    }

    let status = existingInvoice.status;
    if (body.status === "Paid") status = "PAID";
    else if (body.status === "Partial") status = "PARTIALLY_PAID";
    else if (body.status === "Unpaid") status = "SENT";
    else if (body.status === "Cancelled") status = "CANCELLED";

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(body.total !== undefined && { total: body.total }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invoice updated successfully.",
      data: updatedInvoice,
    });
  } catch (error) {
    console.error("PATCH invoice error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update invoice.",
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

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        businessId: membership.businessId,
      },
      include: {
        items: true,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found." },
        { status: 404 }
      );
    }

    // Wrap in transaction to restore stock and delete transactions
    await prisma.$transaction(async (tx) => {
      for (const item of existingInvoice.items) {
        // Restore stock only when this invoice item is linked to a product
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // Delete Inventory Transactions
      await tx.inventoryTransaction.deleteMany({
        where: {
          businessId: membership.businessId,
          referenceType: "SALE",
          referenceId: existingInvoice.id,
        },
      });

      // Delete Ledger Entries
      await tx.ledgerEntry.deleteMany({
        where: {
          businessId: membership.businessId,
          invoiceId: existingInvoice.id,
        },
      });

      // Soft delete invoice (or hard delete if preferred, but for now we'll set status to CANCELLED to preserve history or hard delete it)
      // I will hard delete since it's a DELETE endpoint, or I can soft-delete by setting status = 'CANCELLED'
      // Wait, there might be foreign key constraints.
      // Let's just delete it, since onDelete: Cascade might not be set for invoiceItems. We need to delete invoiceItems first.
      
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: existingInvoice.id }
      });

      await tx.invoice.delete({
        where: { id: existingInvoice.id }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE invoice error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete invoice.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
