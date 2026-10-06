import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get("aryahs_session")?.value;

    if (!userId) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });

    const membership = await prisma.businessMember.findFirst({
      where: { userId },
      select: { businessId: true },
    });

    if (!membership) return NextResponse.json({ success: false, message: "No business is associated with this account." }, { status: 400 });

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        businessId: membership.businessId,
      },
      include: { items: true, customer: true, business: true },
    });

    if (!invoice) return NextResponse.json({ success: false, message: "Invoice not found." }, { status: 404 });

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("GET invoice error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch invoice.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get("aryahs_session")?.value;

    if (!userId) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });

    const membership = await prisma.businessMember.findFirst({
      where: { userId },
      select: { businessId: true },
    });

    if (!membership) return NextResponse.json({ success: false, message: "No business is associated with this account." }, { status: 400 });

    const body = await request.json();
    const {
      customerId,
      invoiceDate,
      dueDate,
      paymentStatus,
      paidAmount,
      items,
      total,
      subtotal,
      gstAmount,
    } = body;

    if (!customerId) return NextResponse.json({ success: false, message: "Customer ID is required." }, { status: 400 });
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ success: false, message: "At least one item is required." }, { status: 400 });

    const invoiceTotal = Number(total);
    if (!Number.isFinite(invoiceTotal) || invoiceTotal <= 0) return NextResponse.json({ success: false, message: "Invoice total must be greater than zero." }, { status: 400 });

    const normalizedPaymentStatus = typeof paymentStatus === "string" ? paymentStatus.trim().toLowerCase() : "unpaid";
    if (!["paid", "unpaid", "partial"].includes(normalizedPaymentStatus)) return NextResponse.json({ success: false, message: "Invalid payment status." }, { status: 400 });

    let finalPaidAmount = 0;
    let dbStatus: any;

    if (normalizedPaymentStatus === "paid") {
      finalPaidAmount = invoiceTotal;
      dbStatus = "PAID";
    } else if (normalizedPaymentStatus === "partial") {
      const requestedPaidAmount = Number(paidAmount);
      if (!Number.isFinite(requestedPaidAmount) || requestedPaidAmount <= 0) return NextResponse.json({ success: false, message: "Paid amount is required for a partial payment." }, { status: 400 });
      if (requestedPaidAmount >= invoiceTotal) return NextResponse.json({ success: false, message: "Paid amount must be less than the invoice total." }, { status: 400 });
      finalPaidAmount = requestedPaidAmount;
      dbStatus = "PARTIALLY_PAID";
    } else {
      finalPaidAmount = 0;
      dbStatus = "SENT";
    }

    const finalInvoiceDate = invoiceDate ? new Date(invoiceDate) : new Date();
    if (Number.isNaN(finalInvoiceDate.getTime())) return NextResponse.json({ success: false, message: "Invalid invoice date." }, { status: 400 });

    let finalDueDate: Date;
    if (dueDate) {
      finalDueDate = new Date(dueDate);
      if (Number.isNaN(finalDueDate.getTime())) return NextResponse.json({ success: false, message: "Invalid due date." }, { status: 400 });
    } else {
      finalDueDate = new Date(finalInvoiceDate);
      finalDueDate.setDate(finalDueDate.getDate() + 7);
    }
    if (finalDueDate.getTime() < finalInvoiceDate.getTime()) return NextResponse.json({ success: false, message: "Due date cannot be before invoice date." }, { status: 400 });

    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, businessId: membership.businessId },
      include: { items: true },
    });

    if (!existingInvoice) return NextResponse.json({ success: false, message: "Invoice not found." }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: customerId, businessId: membership.businessId }
      });
      if (!customer) throw new Error("Customer not found.");

      // 1. Revert Old Items (Stock + InventoryTransactions)
      for (const item of existingInvoice.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      }
      await tx.inventoryTransaction.deleteMany({
        where: { businessId: membership.businessId, referenceType: "SALE", referenceId: existingInvoice.id },
      });
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: existingInvoice.id },
      });

      // 2. Clear Old Ledger Entries and Payments
      await tx.ledgerEntry.deleteMany({
        where: { businessId: membership.businessId, invoiceId: existingInvoice.id },
      });
      await tx.payment.deleteMany({
        where: { businessId: membership.businessId, invoiceId: existingInvoice.id },
      });

      // 3. Update Invoice Record
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          customerId,
          invoiceDate: finalInvoiceDate,
          dueDate: finalDueDate,
          subtotal: Number(subtotal) || 0,
          total: invoiceTotal,
          paidAmount: finalPaidAmount,
          cgst: (Number(gstAmount) || 0) / 2,
          sgst: (Number(gstAmount) || 0) / 2,
          igst: 0,
          status: dbStatus,
        },
      });

      // 4. Create New Items & Deduct Stock & Create InventoryTransactions
      for (const item of items) {
        const productId = item.productId;
        if (!productId) throw new Error("Product ID is missing.");
        const quantity = Number(item.quantity);
        const price = Number(item.price);
        const gst = Number(item.gst) || 0;
        if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Invalid quantity.");
        if (!Number.isFinite(price) || price < 0) throw new Error("Invalid price.");

        const product = await tx.product.findFirst({
          where: { id: productId, businessId: membership.businessId },
        });
        if (!product) throw new Error("Product not found.");
        if (Number(product.stockQuantity) < quantity) throw new Error(`Insufficient stock for ${product.name}.`);

        const itemTotal = quantity * price;
        const itemGst = (itemTotal * gst) / 100;

        await tx.invoiceItem.create({
          data: {
            invoiceId: existingInvoice.id,
            productId: product.id,
            productName: typeof item.productName === "string" ? item.productName : product.name,
            quantity,
            unitPrice: price,
            gstRate: gst,
            taxableAmount: itemTotal,
            cgst: itemGst / 2,
            sgst: itemGst / 2,
            igst: 0,
            total: itemTotal + itemGst,
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: { decrement: quantity } },
        });

        await tx.inventoryTransaction.create({
          data: {
            businessId: membership.businessId,
            productId: product.id,
            type: "SALE",
            quantity,
            referenceType: "SALE",
            referenceId: existingInvoice.id,
            note: `Invoice ${existingInvoice.invoiceNumber}`,
          },
        });
      }

      // 5. Recreate Ledger Entries and Payments
      await tx.ledgerEntry.create({
        data: {
          businessId: membership.businessId,
          customerId,
          invoiceId: existingInvoice.id,
          entryType: "DEBIT",
          amount: invoiceTotal,
          description: `Invoice ${existingInvoice.invoiceNumber}`,
        },
      });

      if (finalPaidAmount > 0) {
        const payment = await tx.payment.create({
          data: {
            businessId: membership.businessId,
            customerId,
            invoiceId: existingInvoice.id,
            type: "RECEIPT",
            method: "CASH",
            amount: finalPaidAmount,
            paymentDate: new Date(),
            notes: "Payment recorded while editing invoice.",
          },
        });
        await tx.ledgerEntry.create({
          data: {
            businessId: membership.businessId,
            customerId,
            invoiceId: existingInvoice.id,
            paymentId: payment.id,
            entryType: "CREDIT",
            amount: finalPaidAmount,
            description: `Payment received for Invoice ${existingInvoice.invoiceNumber}`,
          },
        });
      }

      return await tx.invoice.findUnique({
        where: { id: existingInvoice.id },
        include: { customer: true, items: true },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Invoice updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("PUT invoices/update error:", error);
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
