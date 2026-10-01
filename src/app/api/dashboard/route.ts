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

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [thisMonthInvoices, thisMonthPurchases, outstandingInvoices, products] = await Promise.all([
      // Total Sales this month
      prisma.invoice.aggregate({
        where: {
          businessId,
          invoiceDate: { gte: start, lte: end },
        },
        _sum: { total: true },
      }),

      
      // Purchases this month
      prisma.purchase.aggregate({
        where: {
          businessId,
          purchaseDate: { gte: start, lte: end },
        },
        _sum: { total: true },
      }),

      // Receivables
      prisma.invoice.aggregate({
        where: { businessId },
        _sum: { total: true, paidAmount: true },
      }),

      // Stock Value
      prisma.product.findMany({
        where: { businessId },
        select: { stockQuantity: true, purchasePrice: true },
      }),
    ]);

    const totalSales = Number(thisMonthInvoices._sum.total || 0);
    const totalPurchases = Number(thisMonthPurchases._sum.total || 0);
    const totalInvoices = Number(outstandingInvoices._sum.total || 0);
    const totalPaid = Number(outstandingInvoices._sum.paidAmount || 0);
    const receivables = totalInvoices - totalPaid;

    const stockValue = products.reduce(
      (sum, p) => sum + (Number(p.stockQuantity) * Number(p.purchasePrice || 0)),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        totalSales,
        totalPurchases,
        receivables,
        stockValue,
      },
    });
  } catch (error) {
    console.error("GET dashboard error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
