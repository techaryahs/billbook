import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // ---------------------------------------------------------
    // 1. Authentication
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // 2. Find user's business
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // 3. Read request
    // ---------------------------------------------------------
    const body = await request.json();

    const {
      customerId,
      invoiceDate,
      dueDate,
      paymentStatus,
      paidAmount,
      items,
      invoiceNo,
      total,
      subtotal,
      gstAmount,
    } = body;

    // ---------------------------------------------------------
    // 4. Basic validation
    // ---------------------------------------------------------
    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer ID is required.",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one item is required.",
        },
        { status: 400 },
      );
    }

    const invoiceTotal = Number(total);

    if (!Number.isFinite(invoiceTotal) || invoiceTotal <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice total must be greater than zero.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 5. Validate payment status
    // ---------------------------------------------------------
    const normalizedPaymentStatus =
      typeof paymentStatus === "string"
        ? paymentStatus.trim().toLowerCase()
        : "unpaid";

    if (!["paid", "unpaid", "partial"].includes(normalizedPaymentStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment status.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 6. Determine paid amount + database status
    // ---------------------------------------------------------
    let finalPaidAmount = 0;
    let dbStatus: "PAID" | "PARTIALLY_PAID" | "SENT";

    if (normalizedPaymentStatus === "paid") {
      finalPaidAmount = invoiceTotal;
      dbStatus = "PAID";
    } else if (normalizedPaymentStatus === "partial") {
      const requestedPaidAmount = Number(paidAmount);

      if (!Number.isFinite(requestedPaidAmount) || requestedPaidAmount <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Paid amount is required for a partial payment.",
          },
          { status: 400 },
        );
      }

      if (requestedPaidAmount >= invoiceTotal) {
        return NextResponse.json(
          {
            success: false,
            message:
              "For a partial payment, paid amount must be less than the invoice total.",
          },
          { status: 400 },
        );
      }

      finalPaidAmount = requestedPaidAmount;
      dbStatus = "PARTIALLY_PAID";
    } else {
      finalPaidAmount = 0;
      dbStatus = "SENT";
    }

    // ---------------------------------------------------------
    // 7. Invoice date
    // ---------------------------------------------------------
    const finalInvoiceDate = invoiceDate ? new Date(invoiceDate) : new Date();

    if (Number.isNaN(finalInvoiceDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invoice date.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 8. Due date
    //
    // If frontend sends dueDate, use it.
    //
    // Otherwise:
    // - default to 7 days after invoice date
    //
    // This prevents every unpaid invoice from becoming
    // immediately overdue.
    // ---------------------------------------------------------
    let finalDueDate: Date;

    if (dueDate) {
      finalDueDate = new Date(dueDate);

      if (Number.isNaN(finalDueDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid due date.",
          },
          { status: 400 },
        );
      }
    } else {
      finalDueDate = new Date(finalInvoiceDate);
      finalDueDate.setDate(finalDueDate.getDate() + 7);
    }

    // Due date should not be before invoice date.
    if (finalDueDate.getTime() < finalInvoiceDate.getTime()) {
      return NextResponse.json(
        {
          success: false,
          message: "Due date cannot be before invoice date.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 9. Create invoice transaction
    // ---------------------------------------------------------
    const result = await prisma.$transaction(async (tx) => {
      // -------------------------------------------------------
      // Verify customer belongs to this business
      // -------------------------------------------------------
      const customer = await tx.customer.findFirst({
        where: {
          id: customerId,
          businessId: membership.businessId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!customer) {
        throw new Error("Customer not found.");
      }

      // -------------------------------------------------------
      // Create Invoice
      // -------------------------------------------------------
      const invoice = await tx.invoice.create({
        data: {
          businessId: membership.businessId,
          invoiceNumber:
            typeof invoiceNo === "string" && invoiceNo.trim()
              ? invoiceNo.trim()
              : `INV-${Date.now()}`,

          customerId,
          createdById: userId,

          invoiceDate: finalInvoiceDate,
          dueDate: finalDueDate,

          subtotal: Number(subtotal) || 0,
          total: invoiceTotal,

          // IMPORTANT:
          // This was missing in the old implementation.
          paidAmount: finalPaidAmount,

          cgst: (Number(gstAmount) || 0) / 2,
          sgst: (Number(gstAmount) || 0) / 2,
          igst: 0,

          status: dbStatus,
        },
      });

      // -------------------------------------------------------
      // Create Invoice Items
      // -------------------------------------------------------
      for (const item of items) {
        const productId = item.productId;

        if (!productId) {
          throw new Error(`Product ID is missing for invoice item.`);
        }

        const quantity = Number(item.quantity);
        const price = Number(item.price);
        const gst = Number(item.gst) || 0;

        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error(
            `Invalid quantity for product ${item.productName || productId}.`,
          );
        }

        if (!Number.isFinite(price) || price < 0) {
          throw new Error(
            `Invalid price for product ${item.productName || productId}.`,
          );
        }

        // -----------------------------------------------------
        // Verify product belongs to this business
        // -----------------------------------------------------
        const product = await tx.product.findFirst({
          where: {
            id: productId,
            businessId: membership.businessId,
          },
          select: {
            id: true,
            name: true,
            stockQuantity: true,
          },
        });

        if (!product) {
          throw new Error(
            `Product not found: ${item.productName || productId}`,
          );
        }

        // -----------------------------------------------------
        // Stock validation
        // -----------------------------------------------------
        if (Number(product.stockQuantity) < quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available stock: ${product.stockQuantity}`,
          );
        }

        const itemTotal = quantity * price;
        const itemGst = (itemTotal * gst) / 100;

        // -----------------------------------------------------
        // Invoice item
        // -----------------------------------------------------
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            productId: product.id,

            productName:
              typeof item.productName === "string"
                ? item.productName
                : product.name,

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

        // -----------------------------------------------------
        // Deduct inventory
        // -----------------------------------------------------
        await tx.product.update({
          where: {
            id: product.id,
          },
          data: {
            stockQuantity: {
              decrement: quantity,
            },
          },
        });

        // -----------------------------------------------------
        // Inventory transaction
        // -----------------------------------------------------
        await tx.inventoryTransaction.create({
          data: {
            businessId: membership.businessId,
            productId: product.id,

            type: "SALE",

            quantity,

            referenceType: "SALE",
            referenceId: invoice.id,

            note: `Invoice ${invoice.invoiceNumber}`,
          },
        });
      }

      // -------------------------------------------------------
      // Customer ledger
      //
      // Full invoice amount is debited.
      // If there is an initial payment, create a CREDIT entry
      // as well.
      // -------------------------------------------------------
      await tx.ledgerEntry.create({
        data: {
          businessId: membership.businessId,
          customerId,
          invoiceId: invoice.id,

          entryType: "DEBIT",
          amount: invoiceTotal,

          description: `Invoice ${invoice.invoiceNumber}`,
        },
      });

      // -------------------------------------------------------
      // If invoice was created as Paid or Partial,
      // record the initial payment as a Payment record.
      //
      // This keeps Payment history consistent with paidAmount.
      // -------------------------------------------------------
      if (finalPaidAmount > 0) {
        const initialPayment = await tx.payment.create({
          data: {
            businessId: membership.businessId,

            customerId,
            invoiceId: invoice.id,

            type: "RECEIPT",
            method: "CASH",

            amount: finalPaidAmount,

            paymentDate: new Date(),

            referenceNumber: null,
            notes: "Initial payment recorded while creating invoice.",
          },
        });

        await tx.ledgerEntry.create({
          data: {
            businessId: membership.businessId,
            customerId,
            invoiceId: invoice.id,
            paymentId: initialPayment.id,

            entryType: "CREDIT",
            amount: finalPaidAmount,

            description: `Initial payment received for Invoice ${invoice.invoiceNumber}`,
          },
        });
      }

      // -------------------------------------------------------
      // Return fresh invoice
      // -------------------------------------------------------
      return await tx.invoice.findUnique({
        where: {
          id: invoice.id,
        },
        include: {
          customer: true,
          items: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Invoice created successfully.",
      data: result,
    });
  } catch (error) {
    console.error("POST invoices/create error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create invoice.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
