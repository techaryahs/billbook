import type { CollectionInvoice } from "@/lib/ai/payment-collection-data";

export type ReminderTone = "friendly" | "professional" | "firm";

type GenerateReminderInput = {
  customerName: string;
  invoices: CollectionInvoice[];
  tone?: ReminderTone;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date | null): string {
  if (!date) {
    return "No due date specified";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getToneOpening(customerName: string, tone: ReminderTone): string {
  if (tone === "friendly") {
    return `Hi ${customerName}, hope you're doing well.`;
  }

  if (tone === "firm") {
    return `Dear ${customerName}, this is a reminder regarding the outstanding payment on your account.`;
  }

  return `Dear ${customerName}, we hope you're doing well.`;
}

export function generatePaymentReminder({
  customerName,
  invoices,
  tone = "professional",
}: GenerateReminderInput): string {
  if (!invoices.length) {
    return "";
  }

  const totalOutstanding = invoices.reduce(
    (sum, invoice) => sum + invoice.outstandingAmount,
    0,
  );

  const overdueInvoices = invoices.filter(
    (invoice) => invoice.status === "OVERDUE",
  );

  const hasOverdueInvoices = overdueInvoices.length > 0;

  const opening = getToneOpening(customerName, tone);

  const invoiceLines = invoices.map((invoice) => {
    const statusText =
      invoice.status === "OVERDUE"
        ? `Overdue by ${invoice.overdueDays} day${
            invoice.overdueDays === 1 ? "" : "s"
          }`
        : `Due ${
            invoice.dueDate ? formatDate(invoice.dueDate) : "date not specified"
          }`;

    return `• Invoice ${invoice.invoiceNumber} — ${formatCurrency(
      invoice.outstandingAmount,
    )} outstanding — ${statusText}`;
  });

  let message = `${opening}\n\n`;

  if (hasOverdueInvoices) {
    message +=
      "This is a gentle reminder that the following payment(s) are currently outstanding:\n\n";
  } else {
    message +=
      "This is a reminder regarding the following outstanding payment(s):\n\n";
  }

  message += invoiceLines.join("\n");

  message += `\n\nTotal outstanding: ${formatCurrency(totalOutstanding)}`;

  if (hasOverdueInvoices) {
    message +=
      "\n\nWe would appreciate it if you could arrange the payment at your earliest convenience.";
  } else {
    message +=
      "\n\nPlease arrange the payment by the due date. If you have already made the payment, please ignore this message.";
  }

  message += "\n\nThank you for your business.";

  return message;
}

export function generateShortPaymentReminder({
  customerName,
  invoices,
  tone = "professional",
}: GenerateReminderInput): string {
  if (!invoices.length) {
    return "";
  }

  const totalOutstanding = invoices.reduce(
    (sum, invoice) => sum + invoice.outstandingAmount,
    0,
  );

  const hasOverdueInvoices = invoices.some(
    (invoice) => invoice.status === "OVERDUE",
  );

  const greeting =
    tone === "friendly" ? `Hi ${customerName},` : `Dear ${customerName},`;

  const paymentType = hasOverdueInvoices
    ? "overdue payment"
    : "outstanding payment";

  return `${greeting}

This is a reminder regarding your ${paymentType} of ${formatCurrency(
    totalOutstanding,
  )}.

Please arrange the payment at your earliest convenience. If you have already made the payment, please ignore this message.

Thank you.`;
}
