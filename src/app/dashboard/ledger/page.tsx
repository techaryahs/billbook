"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";

type LedgerEntry = {
  id: string;
  date: string;
  description: string;
  party: string;
  reference: string;
  type: "Credit" | "Debit";
  amount: number;
};

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ledger");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch ledger data");
      }
      setEntries(json.data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const totalCredit = entries
    .filter((entry) => entry.type === "Credit")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalDebit = entries
    .filter((entry) => entry.type === "Debit")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const balance = totalCredit - totalDebit;

  const filteredEntries = entries.filter(
    (entry) =>
      entry.party.toLowerCase().includes(search.toLowerCase()) ||
      entry.reference.toLowerCase().includes(search.toLowerCase()) ||
      entry.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-6">
        
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Credit"
            value={isLoading ? "..." : `₹${totalCredit.toLocaleString("en-IN")}`}
            type="credit"
          />

          <StatCard
            title="Total Debit"
            value={isLoading ? "..." : `₹${totalDebit.toLocaleString("en-IN")}`}
            type="debit"
          />

          <StatCard
            title="Net Balance"
            value={isLoading ? "..." : `₹${Math.abs(balance).toLocaleString("en-IN")}`}
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

          {isLoading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Loading...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No ledger entries found.
            </div>
          ) : (
            filteredEntries.map((entry) => (
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
            ))
          )}
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
