import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  generatePaymentReminder,
  type ReminderTone,
} from "@/lib/ai/payment-collection";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // -----------------------------------------
    // 1. Authenticate user
    // -----------------------------------------
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

    // -----------------------------------------
    // 2. Find user's business
    // -----------------------------------------
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

    // -----------------------------------------
    // 3. Read request
    // -----------------------------------------
    const body = await request.json();

    const customerId =
      typeof body.customerId === "string" ? body.customerId.trim() : "";

    const tone =
      body.tone === "friendly" || body.tone === "firm"
        ? body.tone
        : "professional";

    const requestedInvoiceIds = Array.isArray(body.invoiceIds)
      ? body.invoiceIds.filter(
          (id: unknown): id is string => typeof id === "string",
        )
      : [];

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer ID is required.",
        },
        { status: 400 },
      );
    }

    // -----------------------------------------
    // 4. Verify customer belongs to business
    // -----------------------------------------
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId: membership.businessId,
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found.",
        },
        { status: 404 },
      );
    }

    // -----------------------------------------
    // 5. Get customer's unpaid invoices
    // -----------------------------------------
    const invoices = await prisma.invoice.findMany({
      where: {
        businessId: membership.businessId,

        customerId,

        status: {
          in: ["SENT", "PARTIALLY_PAID"],
        },

        ...(requestedInvoiceIds.length > 0
          ? {
              id: {
                in: requestedInvoiceIds,
              },
            }
          : {}),
      },

      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        dueDate: true,
        total: true,
        paidAmount: true,
        status: true,
      },

      orderBy: {
        dueDate: "asc",
      },
    });

    // -----------------------------------------
    // 6. Remove fully paid invoices
    // -----------------------------------------
    const outstandingInvoices = invoices
      .map((invoice) => {
        const total = Number(invoice.total ?? 0);

        const paidAmount = Number(invoice.paidAmount ?? 0);

        const outstandingAmount = total - paidAmount;

        if (outstandingAmount <= 0) {
          return null;
        }

        const now = new Date();

        let overdueDays = 0;

        if (invoice.dueDate && invoice.dueDate.getTime() < now.getTime()) {
          overdueDays = Math.max(
            1,
            Math.floor(
              (now.getTime() - invoice.dueDate.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          );
        }

        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          total,
          paidAmount,
          outstandingAmount,
          overdueDays,
          status: overdueDays > 0 ? ("OVERDUE" as const) : ("PENDING" as const),
        };
      })
      .filter(
        (invoice): invoice is NonNullable<typeof invoice> => invoice !== null,
      );

    if (!outstandingInvoices.length) {
      return NextResponse.json(
        {
          success: false,
          message: "This customer has no outstanding invoices.",
        },
        { status: 404 },
      );
    }

    // -----------------------------------------
    // 7. Generate reminder message
    // -----------------------------------------
    const message = generatePaymentReminder({
      customerName: customer.name || "Customer",
      invoices: outstandingInvoices,
      tone: tone as ReminderTone,
    });

    // -----------------------------------------
    // 8. Calculate total
    // -----------------------------------------
    const totalOutstanding = outstandingInvoices.reduce(
      (sum, invoice) => sum + invoice.outstandingAmount,
      0,
    );

    const overdueAmount = outstandingInvoices
      .filter((invoice) => invoice.status === "OVERDUE")
      .reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);

    return NextResponse.json({
      success: true,

      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
        },

        totalOutstanding,

        overdueAmount,

        invoiceCount: outstandingInvoices.length,

        invoices: outstandingInvoices,

        message,

        tone,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error("=================================");
    console.error("PAYMENT REMINDER ERROR");
    console.error(error);
    console.error("MESSAGE:", errorMessage);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate payment reminder.",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
