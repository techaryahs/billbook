import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "OTHER",
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number];

function normalizePaymentMethod(value: unknown): PaymentMethod {
  if (typeof value !== "string") {
    return "CASH";
  }

  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (PAYMENT_METHODS.includes(normalized as PaymentMethod)) {
    return normalized as PaymentMethod;
  }

  return "OTHER";
}

async function getBusinessId(userId: string) {
  const membership = await prisma.businessMember.findFirst({
    where: {
      userId,
    },
    select: {
      businessId: true,
    },
  });

  return membership?.businessId ?? null;
}

// ============================================================
// GET PAYMENTS / RECEIVABLES / PAYABLES
// ============================================================

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

    const businessId = await getBusinessId(userId);

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          message: "No business is associated with this account.",
        },
        { status: 400 },
      );
    }

    const [invoices, purchases] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          businessId,
        },
        include: {
          customer: true,
        },
        orderBy: {
          invoiceDate: "desc",
        },
      }),

      prisma.purchase.findMany({
        where: {
          businessId,
        },
        include: {
          supplier: true,
        },
        orderBy: {
          purchaseDate: "desc",
        },
      }),
    ]);

    // ---------------------------------------------------------
    // Receivables
    // ---------------------------------------------------------
    const receivables = invoices.map((invoice) => {
      const amount = Number(invoice.total);
      const paid = Number(invoice.paidAmount);

      const outstanding = Math.max(0, amount - paid);

      return {
        id: invoice.id,

        customer: invoice.customer?.name || "Unknown Customer",

        invoice: invoice.invoiceNumber,

        date: invoice.invoiceDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),

        dueDate: invoice.dueDate
          ? invoice.dueDate.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : null,

        amount,
        paid,
        outstanding,

        status: invoice.status,
      };
    });

    // ---------------------------------------------------------
    // Payables
    // ---------------------------------------------------------
    const payables = purchases.map((purchase) => {
      const amount = Number(purchase.total);
      const paid = Number(purchase.paidAmount);

      const outstanding = Math.max(0, amount - paid);

      return {
        id: purchase.id,

        supplier: purchase.supplier?.name || "Unknown Supplier",

        invoice: purchase.purchaseNumber,

        date: purchase.purchaseDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),

        dueDate: purchase.dueDate
          ? purchase.dueDate.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : null,

        amount,
        paid,
        outstanding,

        status: purchase.status,
      };
    });

    // ---------------------------------------------------------
    // Summary
    // ---------------------------------------------------------
    const totalReceivable = receivables.reduce(
      (sum, item) => sum + item.outstanding,
      0,
    );

    const totalPayable = payables.reduce(
      (sum, item) => sum + item.outstanding,
      0,
    );

    return NextResponse.json({
      success: true,

      data: {
        receivables,
        payables,

        summary: {
          totalReceivable,
          totalPayable,
          netPosition: totalReceivable - totalPayable,
        },
      },
    });
  } catch (error) {
    console.error("GET payments error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch payments data.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// ============================================================
// POST RECORD PAYMENT
// ============================================================

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

    const businessId = await getBusinessId(userId);

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          message: "No business is associated with this account.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const { type, id, amount, method, referenceNumber, notes } = body;

    // ---------------------------------------------------------
    // Validate type
    // ---------------------------------------------------------
    if (type !== "receivable" && type !== "payable") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment type.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // Validate ID
    // ---------------------------------------------------------
    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment record ID is required.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // Validate amount
    // ---------------------------------------------------------
    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment amount must be greater than zero.",
        },
        { status: 400 },
      );
    }

    const paymentMethod = normalizePaymentMethod(method);

    // ========================================================
    // TRANSACTION
    // ========================================================

    const result = await prisma.$transaction(async (tx) => {
      // ======================================================
      // CUSTOMER RECEIVABLE
      // ======================================================

      if (type === "receivable") {
        const invoice = await tx.invoice.findFirst({
          where: {
            id,
            businessId,
          },
        });

        if (!invoice) {
          throw new Error("Invoice not found.");
        }

        const invoiceTotal = Number(invoice.total);

        const currentPaidAmount = Number(invoice.paidAmount);

        const remainingAmount = Math.max(0, invoiceTotal - currentPaidAmount);

        if (remainingAmount <= 0) {
          throw new Error("This invoice is already fully paid.");
        }

        if (paymentAmount > remainingAmount) {
          throw new Error(
            `Payment amount cannot exceed outstanding amount of ₹${remainingAmount.toLocaleString(
              "en-IN",
            )}.`,
          );
        }

        const newPaidAmount = currentPaidAmount + paymentAmount;

        let newStatus: "SENT" | "PARTIALLY_PAID" | "PAID";

        if (newPaidAmount >= invoiceTotal) {
          newStatus = "PAID";
        } else if (newPaidAmount > 0) {
          newStatus = "PARTIALLY_PAID";
        } else {
          newStatus = "SENT";
        }

        // ----------------------------------------------------
        // Update invoice
        // ----------------------------------------------------
        const updatedInvoice = await tx.invoice.update({
          where: {
            id: invoice.id,
          },

          data: {
            paidAmount: newPaidAmount,

            status: newStatus,
          },
        });

        // ----------------------------------------------------
        // Create payment record
        // ----------------------------------------------------
        const payment = await tx.payment.create({
          data: {
            businessId,

            customerId: invoice.customerId,

            invoiceId: invoice.id,

            type: "RECEIPT",

            method: paymentMethod,

            amount: paymentAmount,

            paymentDate: new Date(),

            referenceNumber: referenceNumber
              ? String(referenceNumber).trim()
              : null,

            notes: notes ? String(notes).trim() : null,
          },
        });

        // ----------------------------------------------------
        // Ledger credit
        // ----------------------------------------------------
        await tx.ledgerEntry.create({
          data: {
            businessId,

            customerId: invoice.customerId,

            invoiceId: invoice.id,

            paymentId: payment.id,

            entryType: "CREDIT",

            amount: paymentAmount,

            description: `Payment received for Invoice ${invoice.invoiceNumber}`,
          },
        });

        return {
          payment,
          invoice: updatedInvoice,
        };
      }

      // ======================================================
      // SUPPLIER PAYABLE
      // ======================================================

      const purchase = await tx.purchase.findFirst({
        where: {
          id,
          businessId,
        },
      });

      if (!purchase) {
        throw new Error("Purchase not found.");
      }

      const purchaseTotal = Number(purchase.total);

      const currentPaidAmount = Number(purchase.paidAmount);

      const remainingAmount = Math.max(0, purchaseTotal - currentPaidAmount);

      if (remainingAmount <= 0) {
        throw new Error("This purchase is already fully paid.");
      }

      if (paymentAmount > remainingAmount) {
        throw new Error(
          `Payment amount cannot exceed outstanding amount of ₹${remainingAmount.toLocaleString(
            "en-IN",
          )}.`,
        );
      }

      const newPaidAmount = currentPaidAmount + paymentAmount;

      let newStatus: "RECEIVED" | "PARTIALLY_PAID" | "PAID";

      if (newPaidAmount >= purchaseTotal) {
        newStatus = "PAID";
      } else if (newPaidAmount > 0) {
        newStatus = "PARTIALLY_PAID";
      } else {
        newStatus = "RECEIVED";
      }

      // ----------------------------------------------------
      // Update purchase
      // ----------------------------------------------------
      const updatedPurchase = await tx.purchase.update({
        where: {
          id: purchase.id,
        },

        data: {
          paidAmount: newPaidAmount,

          status: newStatus,
        },
      });

      // ----------------------------------------------------
      // Create payment
      // ----------------------------------------------------
      const payment = await tx.payment.create({
        data: {
          businessId,

          supplierId: purchase.supplierId,

          purchaseId: purchase.id,

          type: "PAYMENT",

          method: paymentMethod,

          amount: paymentAmount,

          paymentDate: new Date(),

          referenceNumber: referenceNumber
            ? String(referenceNumber).trim()
            : null,

          notes: notes ? String(notes).trim() : null,
        },
      });

      // ----------------------------------------------------
      // Ledger debit
      // ----------------------------------------------------
      await tx.ledgerEntry.create({
        data: {
          businessId,

          supplierId: purchase.supplierId,

          purchaseId: purchase.id,

          paymentId: payment.id,

          entryType: "DEBIT",

          amount: paymentAmount,

          description: `Payment made for Purchase ${purchase.purchaseNumber}`,
        },
      });

      return {
        payment,
        purchase: updatedPurchase,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully.",
      data: result,
    });
  } catch (error) {
    console.error("POST payments error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to record payment.",
      },
      { status: 500 },
    );
  }
}
