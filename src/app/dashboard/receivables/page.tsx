"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Search,
} from "lucide-react";
import { useState } from "react";

type Receivable = {
  id: number;
  customer: string;
  invoice: string;
  date: string;
  dueDate: string;
  amount: number;
  paid: number;
};

type Payable = {
  id: number;
  supplier: string;
  invoice: string;
  date: string;
  dueDate: string;
  amount: number;
  paid: number;
};

const initialReceivables: Receivable[] = [
  {
    id: 1,
    customer: "Rahul Sharma",
    invoice: "INV-001",
    date: "20 Sep 2026",
    dueDate: "30 Sep 2026",
    amount: 5900,
    paid: 5900,
  },
  {
    id: 2,
    customer: "Priya Enterprises",
    invoice: "INV-002",
    date: "22 Sep 2026",
    dueDate: "02 Oct 2026",
    amount: 3540,
    paid: 0,
  },
  {
    id: 3,
    customer: "Amit Traders",
    invoice: "INV-003",
    date: "24 Sep 2026",
    dueDate: "04 Oct 2026",
    amount: 8500,
    paid: 3000,
  },
];

const payables: Payable[] = [
  {
    id: 1,
    supplier: "ABC Suppliers",
    invoice: "PUR-001",
    date: "18 Sep 2026",
    dueDate: "28 Sep 2026",
    amount: 8750,
    paid: 3000,
  },
  {
    id: 2,
    supplier: "Sharma Traders",
    invoice: "PUR-002",
    date: "21 Sep 2026",
    dueDate: "01 Oct 2026",
    amount: 4200,
    paid: 0,
  },
];

export default function ReceivablesPage() {
  const [activeTab, setActiveTab] = useState<"receivables" | "payables">(
    "receivables",
  );

  const [receivables, setReceivables] = useState(initialReceivables);

  const [search, setSearch] = useState("");

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

  const recordPayment = (id: number) => {
    setReceivables((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              paid: item.amount,
            }
          : item,
      ),
    );
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Money to Receive"
            value={totalReceivable}
            icon={<ArrowDownLeft size={20} />}
            type="green"
          />

          <SummaryCard
            title="Money to Pay"
            value={totalPayable}
            icon={<ArrowUpRight size={20} />}
            type="red"
          />

          <SummaryCard
            title="Net Position"
            value={totalReceivable - totalPayable}
            icon={<CheckCircle2 size={20} />}
            type="blue"
          />
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
                  {filteredReceivables.map((item) => {
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
                          {outstanding === 0 ? (
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
                              onClick={() => recordPayment(item.id)}
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
                  })}
                </tbody>
              </table>

              {filteredReceivables.length === 0 && (
                <EmptyState message="No receivables found." />
              )}
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
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPayables.map((item) => {
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
                          ₹{outstanding.toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4">
                          {outstanding === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
                              <CheckCircle2 size={13} />
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                              <Clock3 size={13} />
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredPayables.length === 0 && (
                <EmptyState message="No payables found." />
              )}
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
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  type: "green" | "red" | "blue";
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
        ₹{Math.abs(value).toLocaleString("en-IN")}
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
