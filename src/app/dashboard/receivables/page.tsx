"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Search,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";

type Receivable = {
  id: string;
  customer: string;
  invoice: string;
  date: string;
  dueDate: string;
  amount: number;
  paid: number;
};

type Payable = {
  id: string;
  supplier: string;
  invoice: string;
  date: string;
  dueDate: string;
  amount: number;
  paid: number;
};

export default function ReceivablesPage() {
  const [activeTab, setActiveTab] = useState<"receivables" | "payables">(
    "receivables",
  );

  const [receivables, setReceivables] = useState<Receivable[]>([]);

  const [payables, setPayables] = useState<Payable[]>([]);

  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments");

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch payments data");
      }

      setReceivables(json.data.receivables || []);

      setPayables(json.data.payables || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalReceivable = receivables.reduce(
    (sum, item) => sum + (item.amount - item.paid),
    0,
  );

  const totalPayable = payables.reduce(
    (sum, item) => sum + (item.amount - item.paid),
    0,
  );

  const filteredReceivables = receivables.filter(
    (item) =>
      item.customer.toLowerCase().includes(search.toLowerCase()) ||
      item.invoice.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredPayables = payables.filter(
    (item) =>
      item.supplier.toLowerCase().includes(search.toLowerCase()) ||
      item.invoice.toLowerCase().includes(search.toLowerCase()),
  );

  const recordPayment = async (
    type: "receivable" | "payable",
    id: string,
    amount: number,
  ) => {
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          id,
          amount,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to record payment");
      }

      await fetchPayments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to record payment");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Money to Receive"
            value={totalReceivable}
            icon={<ArrowDownLeft size={20} />}
            type="green"
            isLoading={isLoading}
          />

          <SummaryCard
            title="Money to Pay"
            value={totalPayable}
            icon={<ArrowUpRight size={20} />}
            type="red"
            isLoading={isLoading}
          />

          <SummaryCard
            title="Net Position"
            value={totalReceivable - totalPayable}
            icon={<CheckCircle2 size={20} />}
            type="blue"
            isLoading={isLoading}
          />
        </div>

        {/* AI Payment Collection */}
        <div className="mt-6 overflow-hidden rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 via-white to-blue-50">
          <div className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                <Sparkles size={25} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    AI Payment Collection
                  </h3>

                  <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                    AI POWERED
                  </span>
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Find customers with outstanding payments, identify overdue
                  invoices, and prepare personalized payment reminders.
                </p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span>✓ Outstanding tracking</span>
                  <span>✓ Overdue detection</span>
                  <span>✓ AI reminders</span>
                  <span>✓ WhatsApp follow-up</span>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard/payment-collection"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
            >
              <Sparkles size={17} />
              Open Collection Assistant
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 rounded-xl border bg-white">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("receivables")}
              className={`flex-1 px-5 py-4 text-sm font-semibold transition ${
                activeTab === "receivables"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Receivables
            </button>

            <button
              onClick={() => setActiveTab("payables")}
              className={`flex-1 px-5 py-4 text-sm font-semibold transition ${
                activeTab === "payables"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Payables
            </button>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeTab === "receivables"
                    ? "Search customer or invoice..."
                    : "Search supplier or invoice..."
                }
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Receivables */}
          {activeTab === "receivables" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">Customer</th>

                    <th className="px-6 py-3">Invoice</th>

                    <th className="px-6 py-3">Date</th>

                    <th className="px-6 py-3">Due Date</th>

                    <th className="px-6 py-3">Amount</th>

                    <th className="px-6 py-3">Outstanding</th>

                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-sm text-slate-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : filteredReceivables.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState message="No receivables found." />
                      </td>
                    </tr>
                  ) : (
                    filteredReceivables.map((item) => {
                      const outstanding = item.amount - item.paid;

                      return (
                        <tr key={item.id} className="border-t text-sm">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {item.customer}
                          </td>

                          <td className="px-6 py-4 font-medium text-blue-600">
                            {item.invoice}
                          </td>

                          <td className="px-6 py-4 text-slate-600">
                            {item.date}
                          </td>

                          <td className="px-6 py-4 text-slate-600">
                            {item.dueDate}
                          </td>

                          <td className="px-6 py-4 font-medium">
                            ₹{item.amount.toLocaleString("en-IN")}
                          </td>

                          <td className="px-6 py-4">
                            {outstanding <= 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
                                <CheckCircle2 size={13} />
                                Paid
                              </span>
                            ) : (
                              <span className="font-semibold text-red-600">
                                ₹{outstanding.toLocaleString("en-IN")}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {outstanding > 0 ? (
                              <button
                                onClick={() =>
                                  recordPayment(
                                    "receivable",
                                    item.id,
                                    outstanding,
                                  )
                                }
                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                              >
                                Record Payment
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Payables */}
          {activeTab === "payables" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">Supplier</th>

                    <th className="px-6 py-3">Invoice</th>

                    <th className="px-6 py-3">Date</th>

                    <th className="px-6 py-3">Due Date</th>

                    <th className="px-6 py-3">Amount</th>

                    <th className="px-6 py-3">Outstanding</th>

                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-sm text-slate-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : filteredPayables.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState message="No payables found." />
                      </td>
                    </tr>
                  ) : (
                    filteredPayables.map((item) => {
                      const outstanding = item.amount - item.paid;

                      return (
                        <tr key={item.id} className="border-t text-sm">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {item.supplier}
                          </td>

                          <td className="px-6 py-4 font-medium text-blue-600">
                            {item.invoice}
                          </td>

                          <td className="px-6 py-4 text-slate-600">
                            {item.date}
                          </td>

                          <td className="px-6 py-4 text-slate-600">
                            {item.dueDate}
                          </td>

                          <td className="px-6 py-4 font-medium">
                            ₹{item.amount.toLocaleString("en-IN")}
                          </td>

                          <td className="px-6 py-4 font-semibold text-red-600">
                            {outstanding <= 0 ? (
                              <span className="text-green-600">₹0</span>
                            ) : (
                              <>₹{outstanding.toLocaleString("en-IN")}</>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {outstanding <= 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
                                <CheckCircle2 size={13} />
                                Paid
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  recordPayment("payable", item.id, outstanding)
                                }
                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                              >
                                Record Payment
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  type,
  isLoading,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  type: "green" | "red" | "blue";
  isLoading?: boolean;
}) {
  const styles = {
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>

        <div className={`rounded-lg p-2 ${styles[type]}`}>{icon}</div>
      </div>

      <p className="mt-3 text-2xl font-bold text-slate-900">
        {isLoading ? "..." : `₹${Math.abs(value).toLocaleString("en-IN")}`}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-6 py-12 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
