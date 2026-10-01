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

    const expenses = await prisma.expense.findMany({
      where: { businessId: membership.businessId },
      orderBy: { expenseDate: "desc" },
    });

    const mappedExpenses = expenses.map((expense) => ({
      id: expense.id,
      title: expense.description,
      category: expense.category,
      amount: Number(expense.amount),
      date: expense.expenseDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || "",
    }));

    return NextResponse.json({
      success: true,
      data: { expenses: mappedExpenses },
    });
  } catch (error) {
    console.error("GET expenses error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch expenses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
