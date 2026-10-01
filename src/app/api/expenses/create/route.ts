import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ExpenseCategory, PaymentMethod } from "@/generated/prisma/client";

export const runtime = "nodejs";

const mapCategory = (value: string): ExpenseCategory => {
  switch (value.toLowerCase().trim()) {
    case "rent":
      return "RENT";

    case "salary":
      return "SALARY";

    case "utilities":
    case "electricity":
      return "ELECTRICITY";

    case "internet":
      return "INTERNET";

    case "transport":
    case "travel":
      return "TRANSPORT";

    case "marketing":
      return "MARKETING";

    case "office supplies":
    case "office":
      return "OFFICE";

    case "purchase":
      return "PURCHASE";

    case "tax":
      return "TAX";

    default:
      return "OTHER";
  }
};

const mapPaymentMethod = (value?: string): PaymentMethod => {
  switch ((value || "").toLowerCase().trim()) {
    case "cash":
      return "CASH";

    case "upi":
      return "UPI";

    case "bank transfer":
    case "bank_transfer":
    case "bank":
      return "BANK_TRANSFER";

    case "card":
      return "CARD";

    case "cheque":
    case "check":
      return "CHEQUE";

    default:
      return "OTHER";
  }
};

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // 1. Authenticate user
    // --------------------------------------------------
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

    // --------------------------------------------------
    // 2. Get business
    // --------------------------------------------------
    const membership = await prisma.businessMember.findFirst({
      where: { userId },
      select: { businessId: true },
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

    // --------------------------------------------------
    // 3. Read request body
    // --------------------------------------------------
    const body = await request.json();

    const { title, description, category, amount, date, paymentMethod, notes } =
      body;

    // --------------------------------------------------
    // 4. Use description OR title
    // --------------------------------------------------
    const expenseDescription =
      typeof description === "string" && description.trim()
        ? description.trim()
        : typeof title === "string" && title.trim()
          ? title.trim()
          : "";

    // --------------------------------------------------
    // 5. Validate required fields
    // --------------------------------------------------
    if (!expenseDescription || !category || amount == null) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Expense title/description, category and amount are required.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 6. Validate amount
    // --------------------------------------------------
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Expense amount must be a valid positive number.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 7. Normalize enum values
    // --------------------------------------------------
    const expenseCategory = mapCategory(String(category));
    const normalizedPaymentMethod = mapPaymentMethod(paymentMethod);

    // --------------------------------------------------
    // 8. Create expense + ledger entry
    // --------------------------------------------------
    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          businessId: membership.businessId,

          description: expenseDescription,

          category: expenseCategory,

          amount: numericAmount,

          expenseDate: date ? new Date(date) : new Date(),

          paymentMethod: normalizedPaymentMethod,

          notes:
            typeof notes === "string" && notes.trim() ? notes.trim() : null,
        },
      });

      // Create corresponding ledger entry
      await tx.ledgerEntry.create({
        data: {
          businessId: membership.businessId,

          entryType: "DEBIT",

          amount: numericAmount,

          description: `Expense: ${expenseDescription} (${category})`,
        },
      });

      return expense;
    });

    // --------------------------------------------------
    // 9. Success
    // --------------------------------------------------
    return NextResponse.json({
      success: true,
      message: "Expense created successfully.",
      data: result,
    });
  } catch (error) {
    console.error("=================================");
    console.error("POST /api/expenses/create ERROR");
    console.error(error);
    console.error("=================================");

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create expense.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
