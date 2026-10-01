import {
  getBusinessOverview,
  getSalesSummary,
  getPurchaseSummary,
  getInventorySummary,
  getLowStockProducts,
  getOutstandingCustomers,
  getOutstandingSuppliers,
  getTopCustomers,
  getTopProducts,
  getExpenseBreakdown,
  getPaymentSummary,
  getRecentTransactions,
  searchProducts,
} from "./business-data";

import {
  BUSINESS_ASSISTANT_SYSTEM_PROMPT,
  BUSINESS_ASSISTANT_CONTEXT_PROMPT,
} from "./business-prompts";

export type AssistantIntent =
  | "sales"
  | "purchases"
  | "inventory"
  | "low_stock"
  | "out_of_stock"
  | "expenses"
  | "outstanding_customers"
  | "outstanding_suppliers"
  | "top_customers"
  | "top_products"
  | "payments"
  | "recent_transactions"
  | "product_search"
  | "overview";

export type AssistantContext = {
  businessId: string;
  from: Date;
  to: Date;
};

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

/**
 * ---------------------------------------------------------
 * INTENT DETECTION
 * ---------------------------------------------------------
 */
function detectIntent(message: string): AssistantIntent {
  const text = message.toLowerCase().trim();

  // Product-specific lookup should come before
  // generic inventory detection.
  if (
    text.includes("find product") ||
    text.includes("search product") ||
    text.includes("product details") ||
    text.includes("where is product") ||
    text.match(/(?:stock|price|selling price|purchase price)\s+(?:of|for)\s+/i)
  ) {
    return "product_search";
  }

  if (
    text.includes("out of stock") ||
    text.includes("no stock") ||
    text.includes("zero stock") ||
    text.includes("products finished")
  ) {
    return "out_of_stock";
  }

  if (
    text.includes("low stock") ||
    text.includes("low-stock") ||
    text.includes("running low") ||
    text.includes("need to reorder") ||
    text.includes("reorder")
  ) {
    return "low_stock";
  }

  if (
    text.includes("inventory") ||
    text.includes("inventry") ||
    text.includes("stock") ||
    text.includes("available products") ||
    text.includes("products in stock") ||
    text.includes("how many products") ||
    text.includes("how much stock")
  ) {
    return "inventory";
  }

  if (
    text.includes("purchase") ||
    text.includes("purchases") ||
    text.includes("bought") ||
    text.includes("buying") ||
    text.includes("supplier purchase") ||
    text.includes("purchase history") ||
    text.includes("what did i purchase") ||
    text.includes("how much did i purchase")
  ) {
    return "purchases";
  }

  if (
    text.includes("owe") ||
    text.includes("owes") ||
    text.includes("receivable") ||
    text.includes("receivables") ||
    text.includes("customer due") ||
    text.includes("customer dues") ||
    text.includes("customer payment pending") ||
    text.includes("pending customer payment")
  ) {
    return "outstanding_customers";
  }

  if (
    text.includes("supplier due") ||
    text.includes("supplier dues") ||
    text.includes("payable") ||
    text.includes("payables") ||
    text.includes("supplier payment pending") ||
    text.includes("how much do i owe suppliers")
  ) {
    return "outstanding_suppliers";
  }

  if (
    text.includes("top customer") ||
    text.includes("top customers") ||
    text.includes("best customer") ||
    text.includes("best customers") ||
    text.includes("highest customer") ||
    text.includes("largest customer") ||
    text.includes("biggest customer")
  ) {
    return "top_customers";
  }

  if (
    text.includes("top product") ||
    text.includes("top products") ||
    text.includes("best selling") ||
    text.includes("best-selling") ||
    text.includes("most sold") ||
    text.includes("most selling") ||
    text.includes("best product") ||
    text.includes("best products")
  ) {
    return "top_products";
  }

  if (
    text.includes("expense") ||
    text.includes("expenses") ||
    text.includes("spending") ||
    text.includes("spent") ||
    text.includes("cost") ||
    text.includes("costs")
  ) {
    return "expenses";
  }

  if (
    text.includes("payment") ||
    text.includes("payments") ||
    text.includes("collection") ||
    text.includes("collections") ||
    text.includes("cash received") ||
    text.includes("money received")
  ) {
    return "payments";
  }

  if (
    text.includes("recent transaction") ||
    text.includes("recent transactions") ||
    text.includes("latest transaction") ||
    text.includes("latest transactions") ||
    text.includes("recent activity") ||
    text.includes("latest activity")
  ) {
    return "recent_transactions";
  }

  if (
    text.includes("sales") ||
    text.includes("sale") ||
    text.includes("sold") ||
    text.includes("revenue") ||
    text.includes("turnover") ||
    text.includes("how much did i sell")
  ) {
    return "sales";
  }

  return "overview";
}

/**
 * ---------------------------------------------------------
 * DATE RANGE
 * ---------------------------------------------------------
 */
function resolveDateRange(message: string, fallback: AssistantContext) {
  const text = message.toLowerCase();

  const now = new Date();

  // Today
  if (
    text.includes("today") ||
    text.includes("todays") ||
    text.includes("today's")
  ) {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      to: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      ),
    };
  }

  // Yesterday
  if (text.includes("yesterday")) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    return {
      from: new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
      ),
      to: new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
        23,
        59,
        59,
        999,
      ),
    };
  }

  // This week
  if (text.includes("this week") || text.includes("current week")) {
    const day = now.getDay();

    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);

    return {
      from: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate()),
      to: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      ),
    };
  }

  // Last week
  if (text.includes("last week")) {
    const day = now.getDay();

    const diff = day === 0 ? -6 : 1 - day;

    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + diff);

    const lastMonday = new Date(thisMonday);

    lastMonday.setDate(lastMonday.getDate() - 7);

    const lastSunday = new Date(thisMonday);

    lastSunday.setDate(lastSunday.getDate() - 1);

    return {
      from: new Date(
        lastMonday.getFullYear(),
        lastMonday.getMonth(),
        lastMonday.getDate(),
      ),
      to: new Date(
        lastSunday.getFullYear(),
        lastSunday.getMonth(),
        lastSunday.getDate(),
        23,
        59,
        59,
        999,
      ),
    };
  }

  // Last month
  if (text.includes("last month")) {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const lastDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    return {
      from: firstDay,
      to: lastDay,
    };
  }

  // This month
  if (text.includes("this month") || text.includes("current month")) {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }

  return {
    from: fallback.from,
    to: fallback.to,
  };
}

/**
 * ---------------------------------------------------------
 * RESPONSE FORMATTERS
 * ---------------------------------------------------------
 */

function formatOverview(data: any) {
  return [
    "Business Summary",
    "",
    `Sales: ${money(data.sales)}`,
    `Purchases: ${money(data.purchases)}`,
    `Expenses: ${money(data.expenses)}`,
    `Estimated Profit: ${money(data.estimatedProfit)}`,
    `Outstanding Receivables: ${money(data.receivables)}`,
    `Outstanding Payables: ${money(data.payables)}`,
    "",
    `Products: ${data.productCount}`,
    `Customers: ${data.customerCount}`,
    `Suppliers: ${data.supplierCount}`,
    `Low-stock Products: ${data.lowStockCount}`,
    `Out-of-stock Products: ${data.outOfStockCount}`,
  ].join("\n");
}

function formatSales(data: any) {
  const lines = [
    "Sales Summary",
    "",
    `Invoices: ${data.invoiceCount}`,
    `Total Sales: ${money(data.totalSales)}`,
    `Collected: ${money(data.totalCollected)}`,
    `Outstanding: ${money(data.outstanding)}`,
  ];

  if (data.invoices?.length) {
    lines.push("", "Recent Sales:");

    for (const invoice of data.invoices.slice(0, 10)) {
      lines.push(
        `• ${invoice.invoiceNumber} — ${invoice.customer} — ${money(invoice.total)} — ${invoice.status}`,
      );
    }
  }

  return lines.join("\n");
}

function formatPurchases(data: any) {
  const lines = [
    "Purchase Summary",
    "",
    `Purchases: ${data.purchaseCount}`,
    `Total Purchases: ${money(data.totalPurchases)}`,
    `Paid: ${money(data.totalPaid)}`,
    `Outstanding: ${money(data.outstanding)}`,
  ];

  if (data.purchases?.length) {
    lines.push("", "Recent Purchases:");

    for (const purchase of data.purchases.slice(0, 10)) {
      lines.push(
        `• ${purchase.purchaseNumber} — ${purchase.supplier} — ${money(purchase.total)} — ${purchase.status}`,
      );
    }
  }

  return lines.join("\n");
}

function formatInventory(data: any) {
  const lines = [
    "Inventory Summary",
    "",
    `Products: ${data.productCount}`,
    `Total Units: ${data.totalUnits}`,
    `Stock Value: ${money(data.stockValue)}`,
    `Low Stock: ${data.lowStockCount}`,
    `Out of Stock: ${data.outOfStockCount}`,
  ];

  if (data.lowStockProducts?.length) {
    lines.push("", "Low-stock Products:");

    for (const product of data.lowStockProducts.slice(0, 10)) {
      lines.push(
        `• ${product.name} — ${product.stock} available, minimum ${product.minimumStock}`,
      );
    }
  }

  return lines.join("\n");
}

function formatLowStock(data: any) {
  if (!data.length) {
    return "Good news — no products are currently below their minimum stock level.";
  }

  return [
    "Low-stock Products",
    "",
    ...data
      .slice(0, 20)
      .map(
        (product: any) =>
          `• ${product.name} — ${product.stock} available / minimum ${product.minimumStock}`,
      ),
  ].join("\n");
}

function formatOutOfStock(data: any) {
  if (!data.length) {
    return "There are currently no out-of-stock products.";
  }

  return [
    "Out-of-stock Products",
    "",
    ...data.slice(0, 20).map((product: any) => `• ${product.name}`),
  ].join("\n");
}

function formatExpenses(data: any) {
  const lines = ["Expense Summary", "", `Total Expenses: ${money(data.total)}`];

  if (data.byCategory?.length) {
    lines.push("", "By Category:");

    for (const item of data.byCategory) {
      lines.push(`• ${item.category}: ${money(item.amount)}`);
    }
  }

  if (data.recent?.length) {
    lines.push("", "Recent Expenses:");

    for (const expense of data.recent.slice(0, 10)) {
      lines.push(
        `• ${expense.description} — ${money(expense.amount)} — ${expense.category}`,
      );
    }
  }

  return lines.join("\n");
}

function formatOutstandingCustomers(customers: any[]) {
  if (!customers.length) {
    return "No outstanding customer payments were found.";
  }

  const total = customers.reduce(
    (sum, customer) => sum + Number(customer.amount),
    0,
  );

  return [
    "Outstanding Customer Payments",
    "",
    `Total Outstanding: ${money(total)}`,
    "",
    ...customers
      .slice(0, 20)
      .map((customer) => `• ${customer.name}: ${money(customer.amount)}`),
  ].join("\n");
}

function formatOutstandingSuppliers(suppliers: any[]) {
  if (!suppliers.length) {
    return "No outstanding supplier payments were found.";
  }

  const total = suppliers.reduce(
    (sum, supplier) => sum + Number(supplier.amount),
    0,
  );

  return [
    "Outstanding Supplier Payments",
    "",
    `Total Payable: ${money(total)}`,
    "",
    ...suppliers
      .slice(0, 20)
      .map((supplier) => `• ${supplier.name}: ${money(supplier.amount)}`),
  ].join("\n");
}

function formatTopCustomers(customers: any[]) {
  if (!customers.length) {
    return "No customer sales data was found for this period.";
  }

  return [
    "Top Customers",
    "",
    ...customers.map(
      (customer, index) =>
        `${index + 1}. ${customer.name} — ${money(customer.sales)}`,
    ),
  ].join("\n");
}

function formatTopProducts(products: any[]) {
  if (!products.length) {
    return "No product sales data was found for this period.";
  }

  return [
    "Top Selling Products",
    "",
    ...products.map(
      (product, index) =>
        `${index + 1}. ${product.name} — ${product.quantity} units — ${money(product.revenue)}`,
    ),
  ].join("\n");
}

function formatPayments(data: any) {
  return [
    "Payment Summary",
    "",
    `Money Received: ${money(data.totalReceipts)}`,
    `Money Paid: ${money(data.totalPayments)}`,
    `Net Cash Movement: ${money(data.netCashMovement)}`,
    `Transactions: ${data.count}`,
  ].join("\n");
}

function formatRecentTransactions(data: any) {
  const lines = ["Recent Business Activity", ""];

  if (data.sales?.length) {
    lines.push("Sales:");

    for (const sale of data.sales.slice(0, 5)) {
      lines.push(`• ${sale.invoiceNumber} — ${money(Number(sale.total ?? 0))}`);
    }
  }

  if (data.purchases?.length) {
    lines.push("", "Purchases:");

    for (const purchase of data.purchases.slice(0, 5)) {
      lines.push(
        `• ${purchase.purchaseNumber} — ${money(Number(purchase.total ?? 0))}`,
      );
    }
  }

  if (data.expenses?.length) {
    lines.push("", "Expenses:");

    for (const expense of data.expenses.slice(0, 5)) {
      lines.push(
        `• ${expense.description} — ${money(Number(expense.amount ?? 0))}`,
      );
    }
  }

  return lines.join("\n");
}

/**
 * ---------------------------------------------------------
 * MAIN ASSISTANT
 * ---------------------------------------------------------
 */
export async function answerBusinessQuestion(
  message: string,
  context: AssistantContext,
) {
  const intent = detectIntent(message);

  const range = resolveDateRange(message, context);

  switch (intent) {
    case "sales": {
      const data = await getSalesSummary(context.businessId, range);

      return {
        answer: formatSales(data),
        intent,
        data,
      };
    }

    case "purchases": {
      const data = await getPurchaseSummary(context.businessId, range);

      return {
        answer: formatPurchases(data),
        intent,
        data,
      };
    }

    case "inventory": {
      const data = await getInventorySummary(context.businessId);

      return {
        answer: formatInventory(data),
        intent,
        data,
      };
    }

    case "low_stock": {
      const data = await getLowStockProducts(context.businessId);

      return {
        answer: formatLowStock(data),
        intent,
        data,
      };
    }

    case "out_of_stock": {
      const data = await getInventorySummary(context.businessId);

      return {
        answer: formatOutOfStock(data.outOfStockProducts),
        intent,
        data: data.outOfStockProducts,
      };
    }

    case "expenses": {
      const data = await getExpenseBreakdown(context.businessId, range);

      return {
        answer: formatExpenses(data),
        intent,
        data,
      };
    }

    case "outstanding_customers": {
      const data = await getOutstandingCustomers(context.businessId);

      return {
        answer: formatOutstandingCustomers(data),
        intent,
        data,
      };
    }

    case "outstanding_suppliers": {
      const data = await getOutstandingSuppliers(context.businessId);

      return {
        answer: formatOutstandingSuppliers(data),
        intent,
        data,
      };
    }

    case "top_customers": {
      const data = await getTopCustomers(context.businessId, range);

      return {
        answer: formatTopCustomers(data),
        intent,
        data,
      };
    }

    case "top_products": {
      const data = await getTopProducts(context.businessId, range);

      return {
        answer: formatTopProducts(data),
        intent,
        data,
      };
    }

    case "payments": {
      const data = await getPaymentSummary(context.businessId, range);

      return {
        answer: formatPayments(data),
        intent,
        data,
      };
    }

    case "recent_transactions": {
      const data = await getRecentTransactions(context.businessId);

      return {
        answer: formatRecentTransactions(data),
        intent,
        data,
      };
    }

    case "product_search": {
      const searchQuery = extractProductSearchQuery(message);

      if (!searchQuery) {
        const data = await getInventorySummary(context.businessId);

        return {
          answer: formatInventory(data),
          intent: "inventory",
          data,
        };
      }

      const data = await searchProducts(context.businessId, searchQuery);

      if (!data.length) {
        return {
          answer: `I couldn't find a product matching "${searchQuery}".`,
          intent,
          data: [],
        };
      }

      return {
        answer: [
          `Product Search: ${searchQuery}`,
          "",
          ...data.map(
            (product) =>
              `• ${product.name} — Stock: ${product.stock}, Selling Price: ${money(product.sellingPrice)}, Purchase Price: ${money(product.purchasePrice)}`,
          ),
        ].join("\n"),
        intent,
        data,
      };
    }

    case "overview":
    default: {
      const data = await getBusinessOverview(context.businessId, range);

      return {
        answer: formatOverview(data),
        intent: "overview",
        data,
      };
    }
  }
}

/**
 * Try to extract:
 *
 * "stock of iPhone"
 * "price of laptop"
 * "find product keyboard"
 */
function extractProductSearchQuery(message: string) {
  const patterns = [
    /(?:stock|price|selling price|purchase price)\s+(?:of|for)\s+(.+)/i,
    /(?:find product|search product|product details)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);

    if (match?.[1]) {
      return match[1].replace(/[?.!]+$/, "").trim();
    }
  }

  return null;
}

/**
 * Exported so the route/UI can display
 * the recognized intent when needed.
 */
export { detectIntent };
