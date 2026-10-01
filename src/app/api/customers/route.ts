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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const customers = await prisma.customer.findMany({
      where: {
        businessId: membership.businessId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute outstanding manually for now, or just return customers. We can calculate this from Ledger or Invoices/Payments.
    // Let's aggregate outstanding from Invoices where status != PAID and customerId == customer.id.
    // Or we can return openingBalance + sum(Invoices.total - Invoices.paidAmount).
    // Actually, let's fetch customers with their invoices to calculate the exact outstanding.
    const customersWithOutstanding = await Promise.all(
      customers.map(async (c) => {
        const invoices = await prisma.invoice.findMany({
          where: { customerId: c.id, businessId: membership.businessId },
          select: { total: true, paidAmount: true },
        });
        const outstanding = invoices.reduce(
          (sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)),
          Number(c.openingBalance) || 0
        );
        return {
          ...c,
          outstanding,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: customersWithOutstanding,
    });
  } catch (error) {
    console.error("GET customers error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customers",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, phone, email, city, billingAddress, state, pincode, gstin, isActive } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Customer name is required." },
        { status: 400 }
      );
    }

    const newCustomer = await prisma.customer.create({
      data: {
        businessId: membership.businessId,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        city: city?.trim() || null,
        billingAddress: billingAddress?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        gstin: gstin?.trim() || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Customer created successfully.",
        data: newCustomer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST customers error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create customer.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
