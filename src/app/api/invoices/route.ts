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
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

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

    const businessId = membership.businessId;

    const [invoices, customers, products] = await Promise.all([
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

      prisma.customer.findMany({
        where: {
          businessId,
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      }),

      prisma.product.findMany({
        where: {
          businessId,
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    const mappedInvoices = invoices.map((inv) => {
      let status = "Unpaid";

      if (inv.status === "PAID") {
        status = "Paid";
      } else if (inv.status === "PARTIALLY_PAID") {
        status = "Partial";
      } else if (inv.status === "CANCELLED") {
        status = "Cancelled";
      } else if (inv.status === "SENT") {
        status = "Sent";
      } else if (inv.status === "DRAFT") {
        status = "Draft";
      }

      return {
        id: inv.id,
        invoiceNo: inv.invoiceNumber,
        customer: inv.customer?.name || "Unknown Customer",
        date: inv.invoiceDate.toISOString(),
        dueDate: inv.dueDate?.toISOString() || null,
        total: Number(inv.total),
        paidAmount: Number(inv.paidAmount),
        outstanding: Math.max(0, Number(inv.total) - Number(inv.paidAmount)),
        status,
      };
    });

    const mappedCustomers = customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || "",
      email: c.email || "",
      gstin: c.gstin || "",
      city: c.city || "",
      state: c.state || "",
    }));

    const mappedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || "",
      barcode: p.barcode || "",
      price: Number(p.sellingPrice),
      purchasePrice: Number(p.purchasePrice),
      stock: Number(p.stockQuantity),
      minStock: Number(p.minStock),
      gst: Number(p.gstRate),
      unit: p.unit,
    }));

    return NextResponse.json({
      success: true,
      data: {
        invoices: mappedInvoices,
        customers: mappedCustomers,
        products: mappedProducts,
      },
    });
  } catch (error) {
    console.error("GET invoices error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch invoices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
