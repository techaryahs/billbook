import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/purchases
 *
 * Returns all purchases for the currently logged-in user's business.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("aryahs_session")?.value;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const member = await prisma.businessMember.findFirst({
      where: {
        userId,
      },
      select: {
        businessId: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message: "Business not found",
        },
        { status: 404 },
      );
    }

    const purchases = await prisma.purchase.findMany({
      where: {
        businessId: member.businessId,
      },
      orderBy: {
        purchaseDate: "desc",
      },
      include: {
        supplier: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            id: true,
          },
        },
      },
    });

    const data = purchases.map((purchase) => ({
      id: purchase.id,
      supplier: purchase.supplier?.name ?? "Unknown Supplier",
      invoiceNo: purchase.purchaseNumber,
      date: purchase.purchaseDate.toISOString(),
      total: Number(purchase.total),
      items: purchase.items.length,
      status: purchase.status,
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get purchases error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch purchases",
        details:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/purchases
 *
 * Creates a purchase manually.
 *
 * The AI invoice review page uses:
 * POST /api/purchases/create
 *
 * This endpoint is for the manual purchase form.
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("aryahs_session")?.value;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const member = await prisma.businessMember.findFirst({
      where: {
        userId,
      },
      select: {
        businessId: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message: "Business not found",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const supplierName = String(body.supplier ?? "").trim();
    const purchaseNumber = String(body.invoiceNo ?? "").trim();

    const items = Array.isArray(body.items) ? body.items : [];

    if (!supplierName) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier is required",
        },
        { status: 400 },
      );
    }

    if (!purchaseNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice number is required",
        },
        { status: 400 },
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one purchase item is required",
        },
        { status: 400 },
      );
    }

    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        businessId: member.businessId,
        purchaseNumber,
      },
      select: {
        id: true,
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        {
          success: false,
          message: `Purchase ${purchaseNumber} already exists`,
        },
        { status: 409 },
      );
    }

    const supplier = await prisma.supplier
      .upsert({
        where: {
          id: body.supplierId || "__new_supplier__",
        },
        update: {},
        create: {
          businessId: member.businessId,
          name: supplierName,
        },
      })
      .catch(async () => {
        return prisma.supplier.create({
          data: {
            businessId: member.businessId,
            name: supplierName,
          },
        });
      });

    const subtotal = Number(body.subtotal ?? 0);
    const discount = Number(body.discount ?? 0);
    const taxableAmount = Number(body.taxableAmount ?? subtotal - discount);
    const cgst = Number(body.cgst ?? 0);
    const sgst = Number(body.sgst ?? 0);
    const igst = Number(body.igst ?? 0);
    const total = Number(body.total ?? taxableAmount + cgst + sgst + igst);

    const purchaseDate = body.date ? new Date(body.date) : new Date();

    const purchase = await prisma.$transaction(async (tx) => {
      const createdPurchase = await tx.purchase.create({
        data: {
          businessId: member.businessId,
          purchaseNumber,
          supplierId: supplier.id,
          createdById: userId,
          status: "RECEIVED",
          purchaseDate,
          subtotal,
          discount,
          taxableAmount,
          cgst,
          sgst,
          igst,
          total,
          paidAmount: 0,
        },
      });

      for (const item of items) {
        const productName = String(
          item.product ?? item.productName ?? "",
        ).trim();

        const quantity = Number(item.quantity ?? 0);
        const price = Number(item.price ?? item.unitPrice ?? 0);
        const itemTotal = Number(item.total ?? quantity * price);

        if (!productName || quantity <= 0) {
          continue;
        }

        let product = await tx.product.findFirst({
          where: {
            businessId: member.businessId,
            name: {
              equals: productName,
              mode: "insensitive",
            },
          },
        });

        if (!product) {
          product = await tx.product.create({
            data: {
              businessId: member.businessId,
              name: productName,
              unit: "PCS",
              purchasePrice: price,
              sellingPrice: price,
              stockQuantity: quantity,
            },
          });
        } else {
          product = await tx.product.update({
            where: {
              id: product.id,
            },
            data: {
              purchasePrice: price,
              stockQuantity: {
                increment: quantity,
              },
            },
          });
        }

        await tx.purchaseItem.create({
          data: {
            purchaseId: createdPurchase.id,
            productId: product.id,
            productName,
            unit: "PCS",
            quantity,
            unitPrice: price,
            taxableAmount: itemTotal,
            total: itemTotal,
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            businessId: member.businessId,
            productId: product.id,
            type: "PURCHASE",
            quantity,
            referenceType: "PURCHASE",
            referenceId: createdPurchase.id,
            note: `Purchase ${purchaseNumber}`,
          },
        });
      }

      await tx.ledgerEntry.create({
        data: {
          businessId: member.businessId,
          supplierId: supplier.id,
          purchaseId: createdPurchase.id,
          entryType: "CREDIT",
          amount: total,
          description: `Purchase ${purchaseNumber}`,
        },
      });

      return createdPurchase;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Purchase created successfully",
        data: {
          id: purchase.id,
          invoiceNo: purchase.purchaseNumber,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create manual purchase error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create purchase",
        details:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    );
  }
}
