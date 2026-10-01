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

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        businessId: membership.businessId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, message: "Customer not found." },
        { status: 404 }
      );
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? existingCustomer.name,
        phone: body.phone?.trim() ?? existingCustomer.phone,
        email: body.email?.trim() ?? existingCustomer.email,
        city: body.city?.trim() ?? existingCustomer.city,
        billingAddress: body.billingAddress?.trim() ?? existingCustomer.billingAddress,
        state: body.state?.trim() ?? existingCustomer.state,
        pincode: body.pincode?.trim() ?? existingCustomer.pincode,
        gstin: body.gstin?.trim() ?? existingCustomer.gstin,
        isActive: body.isActive ?? existingCustomer.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully.",
      data: updatedCustomer,
    });
  } catch (error) {
    console.error("PATCH customer error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update customer.",
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

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        businessId: membership.businessId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, message: "Customer not found." },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.customer.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE customer error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete customer.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
