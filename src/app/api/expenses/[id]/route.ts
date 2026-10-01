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
    const { title, category, amount, paymentMethod, notes, date } = body;

    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        businessId: membership.businessId,
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { success: false, message: "Expense not found." },
        { status: 404 }
      );
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(category && { category }), // Not re-mapping enum in this simple implementation, assuming valid input or no update for category here
        ...(amount !== undefined && { amount }),
        ...(paymentMethod && { paymentMethod }),
        ...(notes !== undefined && { notes }),
        ...(date && { expenseDate: new Date(date) }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Expense updated successfully.",
      data: updatedExpense,
    });
  } catch (error) {
    console.error("PATCH expense error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update expense.",
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

    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        businessId: membership.businessId,
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { success: false, message: "Expense not found." },
        { status: 404 }
      );
    }

    // Delete the expense. Note that we don't have a direct relation between Expense and LedgerEntry in Prisma schema to easily delete the ledger entry.
    // In a real system, we'd either link them or add a reference string. For now, deleting the expense only removes the expense record.
    await prisma.expense.delete({
      where: { id: existingExpense.id }
    });

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE expense error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete expense.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
