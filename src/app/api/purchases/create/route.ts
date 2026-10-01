import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type PurchaseItemInput = {
  productName: string;
  sku?: string | null;
  hsnSac?: string | null;
  unit?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  gstRate?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  taxableAmount?: number;
  total: number;
};

type PurchaseInput = {
  supplierName: string;
  supplierGstin?: string | null;
  purchaseNumber?: string | null;
  purchaseDate?: string | null;
  dueDate?: string | null;

  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;

  items: PurchaseItemInput[];
};

export async function POST(request: Request) {
  try {
    /*
     * ---------------------------------------------------------
     * 1. AUTHENTICATION
     * ---------------------------------------------------------
     */

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

    /*
     * ---------------------------------------------------------
     * 2. FIND USER'S BUSINESS
     * ---------------------------------------------------------
     */

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

    /*
     * ---------------------------------------------------------
     * 3. READ REQUEST
     * ---------------------------------------------------------
     */

    const body = (await request.json()) as PurchaseInput;

    /*
     * ---------------------------------------------------------
     * 4. BASIC VALIDATION
     * ---------------------------------------------------------
     */

    if (
      !body.supplierName?.trim() ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Supplier and at least one purchase item are required.",
        },
        { status: 400 },
      );
    }

    for (const item of body.items) {
      if (!item.productName?.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Every purchase item must have a product name.",
          },
          { status: 400 },
        );
      }

      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid quantity for ${item.productName}.`,
          },
          { status: 400 },
        );
      }

      if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid unit price for ${item.productName}.`,
          },
          { status: 400 },
        );
      }

      if (!Number.isFinite(item.total) || item.total < 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid total for ${item.productName}.`,
          },
          { status: 400 },
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * 5. PURCHASE NUMBER
     * ---------------------------------------------------------
     */

    const purchaseNumber = body.purchaseNumber?.trim() || `PUR-${Date.now()}`;

    /*
     * ---------------------------------------------------------
     * 6. CHECK DUPLICATE PURCHASE
     *
     * IMPORTANT:
     * Use businessId here.
     *
     * The old code used:
     *
     *   member.businessId
     *
     * but there is no "member" variable.
     *
     * We already have:
     *
     *   const businessId = membership.businessId;
     * ---------------------------------------------------------
     */

    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        businessId,
        purchaseNumber,
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: "This purchase already exists.",
        data: existingPurchase,
      });
    }

    /*
     * ---------------------------------------------------------
     * 7. CREATE EVERYTHING IN ONE TRANSACTION
     * ---------------------------------------------------------
     */

    const result = await prisma.$transaction(async (tx) => {
      /*
       * -------------------------------------------------------
       * SUPPLIER
       * -------------------------------------------------------
       */

      let supplier = null;

      /*
       * First try GSTIN.
       */

      if (body.supplierGstin?.trim()) {
        supplier = await tx.supplier.findFirst({
          where: {
            businessId,
            gstin: body.supplierGstin.trim(),
          },
        });
      }

      /*
       * Then try supplier name.
       */

      if (!supplier) {
        supplier = await tx.supplier.findFirst({
          where: {
            businessId,
            name: {
              equals: body.supplierName.trim(),
              mode: "insensitive",
            },
          },
        });
      }

      /*
       * Create supplier if it doesn't exist.
       */

      if (!supplier) {
        supplier = await tx.supplier.create({
          data: {
            businessId,
            name: body.supplierName.trim(),
            gstin: body.supplierGstin?.trim() || null,
          },
        });
      }

      /*
       * -------------------------------------------------------
       * PURCHASE
       * -------------------------------------------------------
       */

      const purchase = await tx.purchase.create({
        data: {
          businessId,
          supplierId: supplier.id,
          createdById: userId,

          purchaseNumber,

          status: "RECEIVED",

          purchaseDate: body.purchaseDate
            ? new Date(body.purchaseDate)
            : new Date(),

          dueDate: body.dueDate ? new Date(body.dueDate) : null,

          subtotal: body.subtotal || 0,
          discount: body.discount || 0,
          taxableAmount: body.taxableAmount || 0,

          cgst: body.cgst || 0,
          sgst: body.sgst || 0,
          igst: body.igst || 0,

          total: body.total || 0,

          paidAmount: 0,
        },
      });

      /*
       * -------------------------------------------------------
       * PURCHASE ITEMS + PRODUCTS + INVENTORY
       * -------------------------------------------------------
       */

      for (const item of body.items) {
        let product = null;

        /*
         * First try SKU.
         */

        if (item.sku?.trim()) {
          product = await tx.product.findFirst({
            where: {
              businessId,
              sku: item.sku.trim(),
            },
          });
        }

        /*
         * Then try product name.
         */

        if (!product) {
          product = await tx.product.findFirst({
            where: {
              businessId,
              name: {
                equals: item.productName.trim(),
                mode: "insensitive",
              },
            },
          });
        }

        /*
         * Create product automatically if it doesn't exist.
         */

        if (!product) {
          product = await tx.product.create({
            data: {
              businessId,

              name: item.productName.trim(),

              sku: item.sku?.trim() || null,

              hsnSac: item.hsnSac?.trim() || null,

              unit: item.unit?.trim() || "PCS",

              purchasePrice: item.unitPrice || 0,

              sellingPrice: 0,

              gstRate: item.gstRate || 0,

              stockQuantity: 0,
            },
          });
        } else {
          /*
           * Update latest purchase information.
           */

          product = await tx.product.update({
            where: {
              id: product.id,
            },
            data: {
              purchasePrice: item.unitPrice || product.purchasePrice,

              gstRate: item.gstRate || product.gstRate,

              hsnSac: item.hsnSac?.trim() || product.hsnSac,
            },
          });
        }

        /*
         * -----------------------------------------------------
         * CREATE PURCHASE ITEM
         * -----------------------------------------------------
         */

        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,

            productId: product.id,

            productName: item.productName.trim(),

            sku: item.sku?.trim() || product.sku || null,

            hsnSac: item.hsnSac?.trim() || product.hsnSac || null,

            unit: item.unit?.trim() || product.unit || "PCS",

            quantity: item.quantity,

            unitPrice: item.unitPrice,

            discount: item.discount || 0,

            taxableAmount: item.taxableAmount || item.total || 0,

            gstRate: item.gstRate || 0,

            cgst: item.cgst || 0,

            sgst: item.sgst || 0,

            igst: item.igst || 0,

            total: item.total || 0,
          },
        });

        /*
         * -----------------------------------------------------
         * INCREASE INVENTORY STOCK
         * -----------------------------------------------------
         */

        await tx.product.update({
          where: {
            id: product.id,
          },
          data: {
            stockQuantity: {
              increment: item.quantity,
            },
          },
        });

        /*
         * -----------------------------------------------------
         * RECORD INVENTORY MOVEMENT
         * -----------------------------------------------------
         */

        await tx.inventoryTransaction.create({
          data: {
            businessId,

            productId: product.id,

            type: "PURCHASE",

            quantity: item.quantity,

            referenceType: "PURCHASE",

            referenceId: purchase.id,

            note: `Stock received through purchase ${purchase.purchaseNumber}`,
          },
        });
      }

      /*
       * -------------------------------------------------------
       * SUPPLIER LEDGER
       * -------------------------------------------------------
       *
       * Purchase creates a payable against the supplier.
       * -------------------------------------------------------
       */

      await tx.ledgerEntry.create({
        data: {
          businessId,

          supplierId: supplier.id,

          purchaseId: purchase.id,

          entryType: "CREDIT",

          amount: body.total || 0,

          description: `Purchase ${purchase.purchaseNumber} from ${supplier.name}`,

          entryDate: body.purchaseDate
            ? new Date(body.purchaseDate)
            : new Date(),
        },
      });

      /*
       * -------------------------------------------------------
       * RETURN COMPLETE PURCHASE
       * -------------------------------------------------------
       */

      return tx.purchase.findUnique({
        where: {
          id: purchase.id,
        },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    /*
     * ---------------------------------------------------------
     * 8. SUCCESS RESPONSE
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success: true,
      alreadyExists: false,
      message: "Purchase created successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Create purchase error:", error);

    /*
     * ---------------------------------------------------------
     * Handle Prisma duplicate constraint.
     *
     * This protects us if two requests arrive at almost
     * exactly the same time.
     * ---------------------------------------------------------
     */

    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : null;

    if (errorCode === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "A purchase with this invoice number already exists.",
          details: "The purchase number must be unique for this business.",
        },
        { status: 409 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unable to create purchase.";

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create purchase.",
        details: message,
      },
      { status: 500 },
    );
  }
}
