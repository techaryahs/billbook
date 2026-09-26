import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Business name is required",
        },
        { status: 400 },
      );
    }

    const legalName = body.legalName ? String(body.legalName).trim() : null;
    const gstin = body.gstin ? String(body.gstin).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const email = body.email ? String(body.email).trim() : null;
    const address = body.address ? String(body.address).trim() : null;
    const city = body.city ? String(body.city).trim() : null;
    const state = body.state ? String(body.state).trim() : null;
    const pincode = body.pincode ? String(body.pincode).trim() : null;

    // Prevent duplicate business
    const existingMembership = await prisma.businessMember.findFirst({
      where: { userId },
    });

    if (existingMembership) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have a business",
        },
        { status: 409 },
      );
    }

    // Use Prisma transaction
    const business = await prisma.$transaction(async (tx) => {
      const newBusiness = await tx.business.create({
        data: {
          name,
          legalName,
          gstin,
          phone,
          email,
          address,
          city,
          state,
          pincode,
        },
      });

      await tx.businessMember.create({
        data: {
          userId,
          businessId: newBusiness.id,
          role: "OWNER",
        },
      });

      return newBusiness;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Business created successfully",
        business: {
          id: business.id,
          name: business.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Business creation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to create business",
      },
      { status: 500 },
    );
  }
}
