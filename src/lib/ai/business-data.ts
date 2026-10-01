import { prisma } from "@/lib/prisma";

type DateRange = {
  from: Date;
  to: Date;
};

const money = (value: number) =>
  Number.isFinite(value) ? Number(value.toFixed(2)) : 0;

const formatCurrency = (value: number) =>
  `₹${money(value).toLocaleString("en-IN")}`;

/**
 * ---------------------------------------------------------
 * BUSINESS OVERVIEW
 * ---------------------------------------------------------
 */
export async function getBusinessOverview(
  businessId: string,
  range: DateRange,
) {
  const [
    salesResult,
    purchaseResult,
    expenseResult,
    receivableResult,
    payableResult,
    productCount,
    lowStockProducts,
    customerCount,
    supplierCount,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: {
        businessId,
        invoiceDate: {
          gte: range.from,
          lte: range.to,
        },
        status: {
          not: "CANCELLED",
        },
      },
      _sum: {
        total: true,
        paidAmount: true,
      },
    }),

    prisma.purchase.aggregate({
      where: {
        businessId,
        purchaseDate: {
          gte: range.from,
          lte: range.to,
        },
        status: {
          not: "CANCELLED",
        },
      },
      _sum: {
        total: true,
        paidAmount: true,
      },
    }),

    prisma.expense.aggregate({
      where: {
        businessId,
        expenseDate: {
          gte: range.from,
          lte: range.to,
        },
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.invoice.aggregate({
      where: {
        businessId,
        status: {
          in: ["SENT", "PARTIALLY_PAID"],
        },
      },
      _sum: {
        total: true,
        paidAmount: true,
      },
    }),

    prisma.purchase.aggregate({
      where: {
        businessId,
        status: {
          in: ["RECEIVED", "PARTIALLY_PAID"],
        },
      },
      _sum: {
        total: true,
        paidAmount: true,
      },
    }),

    prisma.product.count({
      where: {
        businessId,
        isActive: true,
      },
    }),

    prisma.product.findMany({
      where: {
        businessId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        minStock: true,
      },
    }),

    prisma.customer.count({
      where: {
        businessId,
      },
    }),

    prisma.supplier.count({
      where: {
        businessId,
      },
    }),
  ]);

  const sales = Number(salesResult._sum.total ?? 0);
  const salesCollected = Number(salesResult._sum.paidAmount ?? 0);

  const purchases = Number(purchaseResult._sum.total ?? 0);

  const purchasesPaid = Number(purchaseResult._sum.paidAmount ?? 0);

  const expenses = Number(expenseResult._sum.amount ?? 0);

  const receivables = Math.max(
    0,
    Number(receivableResult._sum.total ?? 0) -
      Number(receivableResult._sum.paidAmount ?? 0),
  );

  const payables = Math.max(
    0,
    Number(payableResult._sum.total ?? 0) -
      Number(payableResult._sum.paidAmount ?? 0),
  );

  const lowStock = lowStockProducts.filter(
    (product) => Number(product.stockQuantity) <= Number(product.minStock),
  );

  const outOfStock = lowStockProducts.filter(
    (product) => Number(product.stockQuantity) <= 0,
  );

  const estimatedProfit = sales - purchases - expenses;

  return {
    sales: money(sales),
    salesCollected: money(salesCollected),

    purchases: money(purchases),
    purchasesPaid: money(purchasesPaid),

    expenses: money(expenses),

    receivables: money(receivables),
    payables: money(payables),

    estimatedProfit: money(estimatedProfit),

    productCount,
    customerCount,
    supplierCount,

    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,

    lowStockProducts: lowStock.slice(0, 10).map((product) => ({
      name: product.name,
      stock: Number(product.stockQuantity),
      minimumStock: Number(product.minStock),
    })),

    outOfStockProducts: outOfStock.slice(0, 10).map((product) => ({
      name: product.name,
    })),

    formatted: {
      sales: formatCurrency(sales),
      purchases: formatCurrency(purchases),
      expenses: formatCurrency(expenses),
      receivables: formatCurrency(receivables),
      payables: formatCurrency(payables),
      estimatedProfit: formatCurrency(estimatedProfit),
    },
  };
}

/**
 * ---------------------------------------------------------
 * SALES
 * ---------------------------------------------------------
 */
export async function getSalesSummary(businessId: string, range: DateRange) {
  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      invoiceDate: {
        gte: range.from,
        lte: range.to,
      },
      status: {
        not: "CANCELLED",
      },
    },
    select: {
      id: true,
      invoiceNumber: true,
      invoiceDate: true,
      total: true,
      paidAmount: true,
      status: true,
      customer: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      invoiceDate: "desc",
    },
    take: 100,
  });

  const totalSales = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total ?? 0),
    0,
  );

  const totalCollected = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.paidAmount ?? 0),
    0,
  );

  return {
    invoiceCount: invoices.length,
    totalSales: money(totalSales),
    totalCollected: money(totalCollected),
    outstanding: money(Math.max(0, totalSales - totalCollected)),

    invoices: invoices.slice(0, 20).map((invoice) => ({
      invoiceNumber: invoice.invoiceNumber ?? invoice.id,
      customer: invoice.customer?.name ?? "Walk-in Customer",
      date: invoice.invoiceDate,
      total: Number(invoice.total ?? 0),
      paid: Number(invoice.paidAmount ?? 0),
      due: Math.max(
        0,
        Number(invoice.total ?? 0) - Number(invoice.paidAmount ?? 0),
      ),
      status: invoice.status,
    })),
  };
}

/**
 * ---------------------------------------------------------
 * PURCHASES
 * ---------------------------------------------------------
 */
export async function getPurchaseSummary(businessId: string, range: DateRange) {
  const purchases = await prisma.purchase.findMany({
    where: {
      businessId,
      purchaseDate: {
        gte: range.from,
        lte: range.to,
      },
      status: {
        not: "CANCELLED",
      },
    },
    select: {
      id: true,
      purchaseNumber: true,
      purchaseDate: true,
      total: true,
      paidAmount: true,
      status: true,
      supplier: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      purchaseDate: "desc",
    },
    take: 100,
  });

  const totalPurchases = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.total ?? 0),
    0,
  );

  const totalPaid = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.paidAmount ?? 0),
    0,
  );

  return {
    purchaseCount: purchases.length,
    totalPurchases: money(totalPurchases),
    totalPaid: money(totalPaid),
    outstanding: money(Math.max(0, totalPurchases - totalPaid)),

    purchases: purchases.slice(0, 20).map((purchase) => ({
      purchaseNumber: purchase.purchaseNumber ?? purchase.id,
      supplier: purchase.supplier?.name ?? "Unknown Supplier",
      date: purchase.purchaseDate,
      total: Number(purchase.total ?? 0),
      paid: Number(purchase.paidAmount ?? 0),
      due: Math.max(
        0,
        Number(purchase.total ?? 0) - Number(purchase.paidAmount ?? 0),
      ),
      status: purchase.status,
    })),
  };
}

/**
 * ---------------------------------------------------------
 * INVENTORY
 * ---------------------------------------------------------
 */
export async function getInventorySummary(businessId: string) {
  const products = await prisma.product.findMany({
    where: {
      businessId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      minStock: true,
      purchasePrice: true,
      sellingPrice: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const lowStock = products.filter(
    (product) => Number(product.stockQuantity) <= Number(product.minStock),
  );

  const outOfStock = products.filter(
    (product) => Number(product.stockQuantity) <= 0,
  );

  const totalUnits = products.reduce(
    (sum, product) => sum + Number(product.stockQuantity ?? 0),
    0,
  );

  const stockValue = products.reduce(
    (sum, product) =>
      sum +
      Number(product.stockQuantity ?? 0) * Number(product.purchasePrice ?? 0),
    0,
  );

  return {
    productCount: products.length,
    totalUnits: money(totalUnits),
    stockValue: money(stockValue),

    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,

    products: products.slice(0, 50).map((product) => ({
      name: product.name,
      sku: product.sku,
      stock: Number(product.stockQuantity),
      minimumStock: Number(product.minStock),
      purchasePrice: Number(product.purchasePrice ?? 0),
      sellingPrice: Number(product.sellingPrice ?? 0),
      stockValue: money(
        Number(product.stockQuantity ?? 0) * Number(product.purchasePrice ?? 0),
      ),
    })),

    lowStockProducts: lowStock.map((product) => ({
      name: product.name,
      sku: product.sku,
      stock: Number(product.stockQuantity),
      minimumStock: Number(product.minStock),
    })),

    outOfStockProducts: outOfStock.map((product) => ({
      name: product.name,
      sku: product.sku,
    })),
  };
}

/**
 * ---------------------------------------------------------
 * PRODUCT SEARCH
 * ---------------------------------------------------------
 */
export async function searchProducts(businessId: string, query: string) {
  const products = await prisma.product.findMany({
    where: {
      businessId,
      isActive: true,
      OR: [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          sku: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },
    select: {
      name: true,
      sku: true,
      stockQuantity: true,
      minStock: true,
      purchasePrice: true,
      sellingPrice: true,
    },
    take: 20,
  });

  return products.map((product) => ({
    name: product.name,
    sku: product.sku,
    stock: Number(product.stockQuantity),
    minimumStock: Number(product.minStock),
    purchasePrice: Number(product.purchasePrice ?? 0),
    sellingPrice: Number(product.sellingPrice ?? 0),
  }));
}

/**
 * ---------------------------------------------------------
 * LOW STOCK
 * ---------------------------------------------------------
 */
export async function getLowStockProducts(businessId: string) {
  const products = await prisma.product.findMany({
    where: {
      businessId,
      isActive: true,
    },
    select: {
      name: true,
      sku: true,
      stockQuantity: true,
      minStock: true,
    },
    orderBy: {
      stockQuantity: "asc",
    },
  });

  return products
    .filter(
      (product) => Number(product.stockQuantity) <= Number(product.minStock),
    )
    .map((product) => ({
      name: product.name,
      sku: product.sku,
      stock: Number(product.stockQuantity),
      minimumStock: Number(product.minStock),
    }));
}

/**
 * ---------------------------------------------------------
 * OUTSTANDING CUSTOMERS
 * ---------------------------------------------------------
 */
export async function getOutstandingCustomers(businessId: string) {
  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: {
        in: ["SENT", "PARTIALLY_PAID"],
      },
    },
    select: {
      total: true,
      paidAmount: true,
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  const customerMap = new Map<
    string,
    {
      name: string;
      phone: string | null;
      amount: number;
    }
  >();

  for (const invoice of invoices) {
    const customerId = invoice.customer?.id ?? "walk-in";

    const current = customerMap.get(customerId) ?? {
      name: invoice.customer?.name ?? "Walk-in Customer",
      phone: invoice.customer?.phone ?? null,
      amount: 0,
    };

    current.amount += Math.max(
      0,
      Number(invoice.total ?? 0) - Number(invoice.paidAmount ?? 0),
    );

    customerMap.set(customerId, current);
  }

  return [...customerMap.values()]
    .filter((customer) => customer.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((customer) => ({
      ...customer,
      amount: money(customer.amount),
    }));
}

/**
 * ---------------------------------------------------------
 * OUTSTANDING SUPPLIERS
 * ---------------------------------------------------------
 */
export async function getOutstandingSuppliers(businessId: string) {
  const purchases = await prisma.purchase.findMany({
    where: {
      businessId,
      status: {
        in: ["RECEIVED", "PARTIALLY_PAID"],
      },
    },
    select: {
      total: true,
      paidAmount: true,
      supplier: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  const supplierMap = new Map<
    string,
    {
      name: string;
      phone: string | null;
      amount: number;
    }
  >();

  for (const purchase of purchases) {
    const supplierId = purchase.supplier?.id ?? "unknown";

    const current = supplierMap.get(supplierId) ?? {
      name: purchase.supplier?.name ?? "Unknown Supplier",
      phone: purchase.supplier?.phone ?? null,
      amount: 0,
    };

    current.amount += Math.max(
      0,
      Number(purchase.total ?? 0) - Number(purchase.paidAmount ?? 0),
    );

    supplierMap.set(supplierId, current);
  }

  return [...supplierMap.values()]
    .filter((supplier) => supplier.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((supplier) => ({
      ...supplier,
      amount: money(supplier.amount),
    }));
}

/**
 * ---------------------------------------------------------
 * TOP CUSTOMERS
 * ---------------------------------------------------------
 */
export async function getTopCustomers(businessId: string, range: DateRange) {
  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      invoiceDate: {
        gte: range.from,
        lte: range.to,
      },
      status: {
        not: "CANCELLED",
      },
    },
    select: {
      total: true,
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const customerMap = new Map<
    string,
    {
      name: string;
      sales: number;
    }
  >();

  for (const invoice of invoices) {
    const id = invoice.customer?.id ?? "walk-in";

    const current = customerMap.get(id) ?? {
      name: invoice.customer?.name ?? "Walk-in Customer",
      sales: 0,
    };

    current.sales += Number(invoice.total ?? 0);

    customerMap.set(id, current);
  }

  return [...customerMap.values()]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10)
    .map((customer) => ({
      ...customer,
      sales: money(customer.sales),
    }));
}

/**
 * ---------------------------------------------------------
 * TOP PRODUCTS
 * ---------------------------------------------------------
 */
export async function getTopProducts(businessId: string, range: DateRange) {
  const items = await prisma.invoiceItem.findMany({
    where: {
      invoice: {
        businessId,
        invoiceDate: {
          gte: range.from,
          lte: range.to,
        },
        status: {
          not: "CANCELLED",
        },
      },
    },
    select: {
      quantity: true,
      unitPrice: true,
      total: true,
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const productMap = new Map<
    string,
    {
      name: string;
      quantity: number;
      revenue: number;
    }
  >();

  for (const item of items) {
    const id = item.product?.id ?? `unknown-${Math.random()}`;

    const current = productMap.get(id) ?? {
      name: item.product?.name ?? "Unknown Product",
      quantity: 0,
      revenue: 0,
    };

    current.quantity += Number(item.quantity ?? 0);

    current.revenue += Number(
      item.total ?? Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0),
    );

    productMap.set(id, current);
  }

  return [...productMap.values()]
    .sort((a, b) => {
      if (b.quantity !== a.quantity) {
        return b.quantity - a.quantity;
      }

      return b.revenue - a.revenue;
    })
    .slice(0, 10)
    .map((product) => ({
      ...product,
      quantity: money(product.quantity),
      revenue: money(product.revenue),
    }));
}

/**
 * ---------------------------------------------------------
 * EXPENSE BREAKDOWN
 * ---------------------------------------------------------
 */
export async function getExpenseBreakdown(
  businessId: string,
  range: DateRange,
) {
  const expenses = await prisma.expense.findMany({
    where: {
      businessId,
      expenseDate: {
        gte: range.from,
        lte: range.to,
      },
    },
    select: {
      category: true,
      amount: true,
      description: true,
      expenseDate: true,
    },
    orderBy: {
      expenseDate: "desc",
    },
  });

  const categoryMap = new Map<string, number>();

  for (const expense of expenses) {
    const category = String(expense.category);

    categoryMap.set(
      category,
      (categoryMap.get(category) ?? 0) + Number(expense.amount ?? 0),
    );
  }

  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount ?? 0),
    0,
  );

  return {
    total: money(total),

    byCategory: [...categoryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount: money(amount),
      })),

    recent: expenses.slice(0, 20).map((expense) => ({
      description: expense.description,
      category: expense.category,
      amount: Number(expense.amount ?? 0),
      date: expense.expenseDate,
    })),
  };
}

/**
 * ---------------------------------------------------------
 * PAYMENTS / COLLECTIONS
 * ---------------------------------------------------------
 */
export async function getPaymentSummary(businessId: string, range: DateRange) {
  const payments = await prisma.payment.findMany({
    where: {
      businessId,
      paymentDate: {
        gte: range.from,
        lte: range.to,
      },
    },
    select: {
      amount: true,
      type: true,
      method: true,
      paymentDate: true,
      referenceNumber: true,
      notes: true,
    },
    orderBy: {
      paymentDate: "desc",
    },
  });

  const receipts = payments
    .filter((payment) => payment.type === "RECEIPT")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const paymentsOut = payments
    .filter((payment) => payment.type === "PAYMENT")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  return {
    totalReceipts: money(receipts),
    totalPayments: money(paymentsOut),
    netCashMovement: money(receipts - paymentsOut),
    count: payments.length,

    recent: payments.slice(0, 20).map((payment) => ({
      amount: Number(payment.amount ?? 0),
      type: payment.type,
      method: payment.method,
      date: payment.paymentDate,
      reference: payment.referenceNumber,
      notes: payment.notes,
    })),
  };
}

/**
 * ---------------------------------------------------------
 * RECENT TRANSACTIONS
 * ---------------------------------------------------------
 */
export async function getRecentTransactions(businessId: string) {
  const [invoices, purchases, expenses, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        businessId,
      },
      select: {
        invoiceNumber: true,
        total: true,
        invoiceDate: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        invoiceDate: "desc",
      },
      take: 10,
    }),

    prisma.purchase.findMany({
      where: {
        businessId,
      },
      select: {
        purchaseNumber: true,
        total: true,
        purchaseDate: true,
        supplier: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        purchaseDate: "desc",
      },
      take: 10,
    }),

    prisma.expense.findMany({
      where: {
        businessId,
      },
      select: {
        description: true,
        amount: true,
        expenseDate: true,
      },
      orderBy: {
        expenseDate: "desc",
      },
      take: 10,
    }),

    prisma.payment.findMany({
      where: {
        businessId,
      },
      select: {
        amount: true,
        type: true,
        paymentDate: true,
      },
      orderBy: {
        paymentDate: "desc",
      },
      take: 10,
    }),
  ]);

  return {
    sales: invoices,
    purchases,
    expenses,
    payments,
  };
}
