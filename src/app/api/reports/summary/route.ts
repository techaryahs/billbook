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

    const businessId = membership.businessId;

    const [
      invoicesAggr,
      purchasesAggr,
      expensesAggr,
    ] = await Promise.all([
      // Total Sales, Receivables, Output GST
      prisma.invoice.aggregate({
        where: { businessId },
        _sum: { total: true, paidAmount: true, cgst: true, sgst: true, igst: true },
      }),
      // Total Purchases, Payables, Input GST
      prisma.purchase.aggregate({
        where: { businessId },
        _sum: { total: true, paidAmount: true, cgst: true, sgst: true, igst: true },
      }),
      // Total Expenses
      prisma.expense.aggregate({
        where: { businessId },
        _sum: { amount: true },
      }),
    ]);

    const totalSales = Number(invoicesAggr._sum.total || 0);
    const receivables = totalSales - Number(invoicesAggr._sum.paidAmount || 0);

    const totalPurchases = Number(purchasesAggr._sum.total || 0);
    const payables = totalPurchases - Number(purchasesAggr._sum.paidAmount || 0);

    const totalExpenses = Number(expensesAggr._sum.amount || 0);

    const outputGST = Number(invoicesAggr._sum.cgst || 0) + Number(invoicesAggr._sum.sgst || 0) + Number(invoicesAggr._sum.igst || 0);
    const inputGST = Number(purchasesAggr._sum.cgst || 0) + Number(purchasesAggr._sum.sgst || 0) + Number(purchasesAggr._sum.igst || 0);

    // Compute monthly sales/purchases for the last 6 months
    const monthlySales: { month: string; sales: number; purchases: number }[] = [];
    const now = new Date();
    
    // Simple approach: loop over last 6 months, run query for each month.
    // In production with lots of data, use raw SQL GROUP BY, but this is fine here.
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const monthName = start.toLocaleString("default", { month: "short" });

      const [monthInvoices, monthPurchases] = await Promise.all([
        prisma.invoice.aggregate({
          where: { businessId, invoiceDate: { gte: start, lte: end } },
          _sum: { total: true },
        }),
        prisma.purchase.aggregate({
          where: { businessId, purchaseDate: { gte: start, lte: end } },
          _sum: { total: true },
        }),
      ]);

      monthlySales.push({
        month: monthName,
        sales: Number(monthInvoices._sum.total || 0),
        purchases: Number(monthPurchases._sum.total || 0),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalSales,
        totalPurchases,
        totalExpenses,
        receivables,
        payables,
        outputGST,
        inputGST,
        monthlySales,
      },
    });
  } catch (error) {
    console.error("GET reports summary error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch report summary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
