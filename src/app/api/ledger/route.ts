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

    const dbEntries = await prisma.ledgerEntry.findMany({
      where: { businessId: membership.businessId },
      include: {
        customer: true,
        supplier: true,
        invoice: true,
        purchase: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const entries = dbEntries.map((entry) => {
      let party = "General";
      if (entry.customer) party = entry.customer.name;
      else if (entry.supplier) party = entry.supplier.name;

      let reference = "Manual Entry";
      if (entry.invoice) reference = entry.invoice.invoiceNumber;
      else if (entry.purchase) reference = entry.purchase.purchaseNumber;

      return {
        id: entry.id,
        date: entry.createdAt.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        description: entry.description || "No description",
        party,
        reference,
        type: entry.entryType === "CREDIT" ? "Credit" : "Debit",
        amount: Number(entry.amount),
      };
    });

    return NextResponse.json({
      success: true,
      data: { entries },
    });
  } catch (error) {
    console.error("GET ledger error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch ledger data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
