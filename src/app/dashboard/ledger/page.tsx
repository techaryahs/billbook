"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Search,
} from "lucide-react";

type LedgerEntry = {
  id: number;
  date: string;
  description: string;
  party: string;
  reference: string;
  type: "Credit" | "Debit";
  amount: number;
};

const entries: LedgerEntry[] = [
  {
    id: 1,
    date: "26 Sep 2026",
    description: "Sales Invoice",
    party: "Rahul Sharma",
    reference: "INV-001",
    type: "Credit",
    amount: 5900,
  },
  {
    id: 2,
    date: "26 Sep 2026",
    description: "Office Rent",
    party: "Office Owner",
    reference: "EXP-001",
    type: "Debit",
    amount: 25000,
  },
  {
    id: 3,
    date: "25 Sep 2026",
    description: "Purchase",
    party: "ABC Suppliers",
    reference: "PUR-001",
    type: "Debit",
    amount: 8750,
  },
  {
    id: 4,
    date: "25 Sep 2026",
    description: "Sales Invoice",
    party: "Priya Enterprises",
    reference: "INV-002",
    type: "Credit",
    amount: 3540,
  },
];

export default function LedgerPage() {
  const totalCredit = entries
    .filter((entry) => entry.type === "Credit")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalDebit = entries
    .filter((entry) => entry.type === "Debit")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const balance = totalCredit - totalDebit;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Credit"
            value={`₹${totalCredit.toLocaleString("en-IN")}`}
            type="credit"
          />

          <StatCard
            title="Total Debit"
            value={`₹${totalDebit.toLocaleString("en-IN")}`}
            type="debit"
          />

          <StatCard
            title="Net Balance"
            value={`₹${Math.abs(balance).toLocaleString("en-IN")}`}
            type={balance >= 0 ? "credit" : "debit"}
          />
        </div>

        {/* Search */}
        <div className="mt-6 rounded-xl border bg-white p-4">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search transaction, party or reference..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Ledger */}
        <div className="mt-5 overflow-hidden rounded-xl border bg-white">
          <div className="hidden grid-cols-6 border-b bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Date</span>
            <span>Description</span>
            <span>Party</span>
            <span>Reference</span>
            <span>Type</span>
            <span className="text-right">Amount</span>
          </div>

          {entries.map((entry) => (
            <div
              key={entry.id}
              className="grid gap-3 border-b px-6 py-4 last:border-b-0 md:grid-cols-6 md:items-center"
            >
              <div className="text-sm text-slate-600">{entry.date}</div>

              <div className="font-medium text-slate-900">
                {entry.description}
              </div>

              <div className="text-sm text-slate-600">{entry.party}</div>

              <div className="text-sm font-medium text-blue-600">
                {entry.reference}
              </div>

              <div>
                {entry.type === "Credit" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
                    <ArrowDownLeft size={13} />
                    Credit
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                    <ArrowUpRight size={13} />
                    Debit
                  </span>
                )}
              </div>

              <div
                className={`text-left font-semibold md:text-right ${
                  entry.type === "Credit" ? "text-green-600" : "text-red-600"
                }`}
              >
                {entry.type === "Credit" ? "+" : "-"}₹
                {entry.amount.toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>

        {/* Explanation */}
        <div className="mt-6 rounded-xl border bg-white p-6">
          <div className="flex gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <BookOpen size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                How Aryahs Ledger will work
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Every business transaction will automatically create the
                appropriate ledger entry. Sales, purchases, expenses and
                payments will eventually flow into this ledger automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  type,
}: {
  title: string;
  value: string;
  type: "credit" | "debit";
}) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>

      <p
        className={`mt-2 text-2xl font-bold ${
          type === "credit" ? "text-green-600" : "text-red-600"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
