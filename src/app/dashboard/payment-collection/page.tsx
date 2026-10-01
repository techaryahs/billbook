"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  IndianRupee,
  Loader2,
  MessageCircle,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";

type CollectionInvoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  total: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueDays: number;
  status: "OVERDUE" | "PENDING";
};

type CollectionCustomer = {
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

type CollectionData = {
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

type ReminderTone = "friendly" | "professional" | "firm";

type ReminderData = {
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
  totalOutstanding: number;
  overdueAmount: number;
  invoiceCount: number;
  invoices: CollectionInvoice[];
  message: string;
  tone: ReminderTone;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function normalizeWhatsAppNumber(phone: string | null) {
  if (!phone) {
    return "";
  }

  return phone.replace(/\D/g, "");
}

export default function PaymentCollectionPage() {
  const [data, setData] = useState<CollectionData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] =
    useState<CollectionCustomer | null>(null);

  const [reminder, setReminder] = useState<ReminderData | null>(null);

  const [reminderLoading, setReminderLoading] = useState(false);

  const [reminderError, setReminderError] = useState("");

  const [tone, setTone] = useState<ReminderTone>("professional");

  const [message, setMessage] = useState("");

  const [copied, setCopied] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setError("");

      const response = await fetch("/api/ai/payment-collection", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load payment collection data.",
        );
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleGenerateReminder = async (customer: CollectionCustomer) => {
    if (!customer.customerId) {
      setReminderError(
        "This customer does not have a customer profile, so a reminder cannot be generated.",
      );
      return;
    }

    setSelectedCustomer(customer);
    setReminder(null);
    setMessage("");
    setReminderError("");
    setReminderLoading(true);
    setTone("professional");

    try {
      const response = await fetch("/api/ai/payment-collection/reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customer.customerId,
          tone: "professional",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to generate reminder.");
      }

      setReminder(result.data);
      setMessage(result.data.message);
    } catch (err) {
      setReminderError(
        err instanceof Error ? err.message : "Failed to generate reminder.",
      );
    } finally {
      setReminderLoading(false);
    }
  };

  const regenerateReminder = async (selectedTone: ReminderTone) => {
    if (!selectedCustomer?.customerId) {
      return;
    }

    setTone(selectedTone);
    setReminderLoading(true);
    setReminderError("");

    try {
      const response = await fetch("/api/ai/payment-collection/reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedCustomer.customerId,
          tone: selectedTone,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to generate reminder.");
      }

      setReminder(result.data);
      setMessage(result.data.message);
    } catch (err) {
      setReminderError(
        err instanceof Error ? err.message : "Failed to generate reminder.",
      );
    } finally {
      setReminderLoading(false);
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setReminderError("Unable to copy the message.");
    }
  };

  const openWhatsApp = () => {
    if (!reminder?.customer.phone) {
      setReminderError("This customer does not have a phone number.");
      return;
    }

    const phone = normalizeWhatsAppNumber(reminder.customer.phone);

    if (!phone) {
      setReminderError("The customer phone number is invalid.");
      return;
    }

    const url =
      `https://wa.me/${phone}` + `?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const summary = data?.summary;

  const customerList = useMemo(() => data?.customers ?? [], [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading payment collection...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

              <div>
                <h2 className="font-semibold text-red-900">
                  Unable to load payment collection
                </h2>

                <p className="mt-1 text-sm text-red-700">{error}</p>

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Payment Collection
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track outstanding payments and prepare customer reminders.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-blue-50 p-2.5">
                <IndianRupee className="h-5 w-5 text-blue-600" />
              </div>

              <span className="text-xs font-medium text-slate-400">Total</span>
            </div>

            <p className="mt-5 text-sm text-slate-500">Total Outstanding</p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatCurrency(summary?.totalOutstanding ?? 0)}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-red-50 p-2.5">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>

              <span className="text-xs font-medium text-red-500">
                {summary?.overdueInvoiceCount ?? 0} invoices
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-500">Overdue</p>

            <p className="mt-1 text-2xl font-bold text-red-600">
              {formatCurrency(summary?.totalOverdue ?? 0)}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-amber-50 p-2.5">
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>

              <span className="text-xs font-medium text-amber-500">
                {summary?.pendingInvoiceCount ?? 0} invoices
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-500">Pending / Upcoming</p>

            <p className="mt-1 text-2xl font-bold text-amber-600">
              {formatCurrency(summary?.totalPending ?? 0)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-violet-50 p-2.5">
                <Users className="h-5 w-5 text-violet-600" />
              </div>

              <span className="text-xs font-medium text-slate-400">
                Customers
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Customers with Outstanding
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {summary?.customerCount ?? 0}
            </p>
          </div>
        </div>

        {/* Customer section */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Customers to Follow Up
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Customers are sorted by overdue amount first.
            </p>
          </div>

          {customerList.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No outstanding payments
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                All currently tracked invoices are paid or there are no
                outstanding customer payments.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {customerList.map((customer) => {
                const key = customer.customerId ?? customer.customerName;

                const expanded = expandedCustomer === key;

                return (
                  <div key={key} className="px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                            {customer.customerName.slice(0, 1).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-slate-900">
                              {customer.customerName}
                            </h3>

                            <p className="mt-0.5 text-sm text-slate-500">
                              {customer.phone || "No phone number"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {customer.overdueInvoiceCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {customer.overdueInvoiceCount} overdue
                            </span>
                          )}

                          {customer.pendingInvoiceCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                              <Clock3 className="h-3.5 w-3.5" />
                              {customer.pendingInvoiceCount} pending
                            </span>
                          )}

                          {customer.maxOverdueDays > 0 && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              Up to {customer.maxOverdueDays} days overdue
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-slate-500">Outstanding</p>

                          <p className="mt-0.5 text-xl font-bold text-slate-900">
                            {formatCurrency(customer.totalOutstanding)}
                          </p>

                          {customer.overdueAmount > 0 && (
                            <p className="text-xs font-medium text-red-600">
                              {formatCurrency(customer.overdueAmount)} overdue
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCustomer(expanded ? null : key)
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {expanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            Invoices
                          </button>

                          <button
                            type="button"
                            onClick={() => handleGenerateReminder(customer)}
                            disabled={!customer.customerId || reminderLoading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Reminder
                          </button>
                        </div>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                              <tr>
                                <th className="px-4 py-3 font-medium">
                                  Invoice
                                </th>

                                <th className="px-4 py-3 font-medium">
                                  Due Date
                                </th>

                                <th className="px-4 py-3 font-medium">
                                  Status
                                </th>

                                <th className="px-4 py-3 font-medium">Total</th>

                                <th className="px-4 py-3 text-right font-medium">
                                  Outstanding
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 bg-white">
                              {customer.invoices.map((invoice) => (
                                <tr
                                  key={invoice.id}
                                  className="hover:bg-slate-50"
                                >
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-slate-900">
                                      {invoice.invoiceNumber}
                                    </div>

                                    <div className="mt-0.5 text-xs text-slate-500">
                                      Invoice date:{" "}
                                      {formatDate(invoice.invoiceDate)}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3 text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                      <CalendarDays className="h-4 w-4 text-slate-400" />
                                      {formatDate(invoice.dueDate)}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3">
                                    {invoice.status === "OVERDUE" ? (
                                      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                        Overdue {invoice.overdueDays} days
                                      </span>
                                    ) : (
                                      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                        Pending
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-4 py-3 text-slate-600">
                                    {formatCurrency(invoice.total)}
                                  </td>

                                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                    {formatCurrency(invoice.outstandingAmount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reminder modal */}
      {(selectedCustomer || reminderLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Payment Reminder
                </h2>

                <p className="text-sm text-slate-500">
                  {selectedCustomer?.customerName || "Customer"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setReminder(null);
                  setMessage("");
                  setReminderError("");
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-72px)] overflow-y-auto p-5">
              {reminderLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Preparing payment reminder...
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Checking outstanding invoices
                    </p>
                  </div>
                </div>
              ) : reminder ? (
                <>
                  {/* Reminder summary */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Outstanding</p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {formatCurrency(reminder.totalOutstanding)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-red-50 p-4">
                      <p className="text-xs text-red-600">Overdue</p>

                      <p className="mt-1 text-lg font-bold text-red-700">
                        {formatCurrency(reminder.overdueAmount)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-blue-50 p-4">
                      <p className="text-xs text-blue-600">Invoices</p>

                      <p className="mt-1 text-lg font-bold text-blue-700">
                        {reminder.invoiceCount}
                      </p>
                    </div>
                  </div>

                  {/* Tone */}
                  <div className="mt-5">
                    <label className="text-sm font-medium text-slate-700">
                      Message tone
                    </label>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {(
                        ["friendly", "professional", "firm"] as ReminderTone[]
                      ).map((toneOption) => (
                        <button
                          key={toneOption}
                          type="button"
                          onClick={() => regenerateReminder(toneOption)}
                          disabled={reminderLoading}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
                            tone === toneOption
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {toneOption}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">
                        Message
                      </label>

                      <span className="text-xs text-slate-400">
                        You can edit this before sending
                      </span>
                    </div>

                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      rows={12}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {reminderError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {reminderError}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={copyMessage}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}

                      {copied ? "Copied" : "Copy Message"}
                    </button>

                    <button
                      type="button"
                      onClick={openWhatsApp}
                      disabled={!reminder.customer.phone}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Open WhatsApp
                    </button>
                  </div>

                  <p className="mt-3 text-center text-xs text-slate-400">
                    WhatsApp will open with the message pre-filled. You review
                    and send it manually.
                  </p>
                </>
              ) : (
                <div className="py-10 text-center text-sm text-slate-500">
                  Unable to generate reminder.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
