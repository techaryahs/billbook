import { prisma } from "@/lib/prisma";

export type CollectionInvoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date | null;
  total: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueDays: number;
  status: "OVERDUE" | "PENDING";
};

export type CollectionCustomer = {
  customerId: string | null;
  customerName: string;
  phone: string | null;
  totalOutstanding: number;
  overdueAmount: number;
  pendingAmount: number;
  overdueInvoiceCount: number;
  pendingInvoiceCount: number;
  maxOverdueDays: number;
  invoices: CollectionInvoice[];
};

export type PaymentCollectionData = {
  summary: {
    totalOutstanding: number;
    totalOverdue: number;
    totalPending: number;
    overdueInvoiceCount: number;
    pendingInvoiceCount: number;
    customerCount: number;
  };
  customers: CollectionCustomer[];
};

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function calculateOverdueDays(dueDate: Date | null): number {
  if (!dueDate) {
    return 0;
  }

  const now = new Date();

  if (dueDate.getTime() >= now.getTime()) {
    return 0;
  }

  const difference = now.getTime() - dueDate.getTime();

  return Math.max(1, Math.floor(difference / (1000 * 60 * 60 * 24)));
}

export async function getPaymentCollectionData(
  businessId: string,
): Promise<PaymentCollectionData> {
  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: {
        in: ["SENT", "PARTIALLY_PAID"],
      },
    },
    select: {
      id: true,
      invoiceNumber: true,
      invoiceDate: true,
      dueDate: true,
      total: true,
      paidAmount: true,
      status: true,

      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },

    orderBy: {
      dueDate: "asc",
    },
  });

  const customers = new Map<string, CollectionCustomer>();

  let totalOutstanding = 0;
  let totalOverdue = 0;
  let totalPending = 0;
  let overdueInvoiceCount = 0;
  let pendingInvoiceCount = 0;

  for (const invoice of invoices) {
    const total = toNumber(invoice.total);
    const paidAmount = toNumber(invoice.paidAmount);

    const outstandingAmount = total - paidAmount;

    // Ignore invoices which are already fully paid.
    if (outstandingAmount <= 0) {
      continue;
    }

    const overdueDays = calculateOverdueDays(invoice.dueDate);

    const isOverdue = overdueDays > 0;

    const status: "OVERDUE" | "PENDING" = isOverdue ? "OVERDUE" : "PENDING";

    const collectionInvoice: CollectionInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      total,
      paidAmount,
      outstandingAmount,
      overdueDays,
      status,
    };

    totalOutstanding += outstandingAmount;

    if (isOverdue) {
      totalOverdue += outstandingAmount;
      overdueInvoiceCount++;
    } else {
      totalPending += outstandingAmount;
      pendingInvoiceCount++;
    }

    /*
     * Invoices without a customer are grouped separately.
     * This can happen with walk-in/anonymous sales.
     */
    const customerId = invoice.customer?.id ?? null;

    const customerKey = customerId ?? `walk-in:${invoice.id}`;

    let customer = customers.get(customerKey);

    if (!customer) {
      customer = {
        customerId,
        customerName: invoice.customer?.name ?? "Walk-in Customer",
        phone: invoice.customer?.phone ?? null,
        totalOutstanding: 0,
        overdueAmount: 0,
        pendingAmount: 0,
        overdueInvoiceCount: 0,
        pendingInvoiceCount: 0,
        maxOverdueDays: 0,
        invoices: [],
      };

      customers.set(customerKey, customer);
    }

    customer.totalOutstanding += outstandingAmount;

    if (isOverdue) {
      customer.overdueAmount += outstandingAmount;

      customer.overdueInvoiceCount++;

      customer.maxOverdueDays = Math.max(customer.maxOverdueDays, overdueDays);
    } else {
      customer.pendingAmount += outstandingAmount;

      customer.pendingInvoiceCount++;
    }

    customer.invoices.push(collectionInvoice);
  }

  /*
   * Put customers with overdue payments first,
   * then sort by total outstanding amount.
   */
  const sortedCustomers = Array.from(customers.values()).sort((a, b) => {
    if (b.overdueAmount !== a.overdueAmount) {
      return b.overdueAmount - a.overdueAmount;
    }

    return b.totalOutstanding - a.totalOutstanding;
  });

  return {
    summary: {
      totalOutstanding,
      totalOverdue,
      totalPending,
      overdueInvoiceCount,
      pendingInvoiceCount,
      customerCount: sortedCustomers.length,
    },

    customers: sortedCustomers,
  };
}
