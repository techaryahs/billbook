"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  FileText,
  IndianRupee,
  TrendingUp,
} from "lucide-react";

type MonthlySales = { month: string; sales: number; purchases: number };

type SummaryData = {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  receivables: number;
  payables: number;
  outputGST: number;
  inputGST: number;
  monthlySales: MonthlySales[];
};

export default function ReportsPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/reports/summary");
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to fetch summary data");
        }
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const totalSales = data?.totalSales || 0;
  const totalPurchases = data?.totalPurchases || 0;
  const totalExpenses = data?.totalExpenses || 0;
  const receivables = data?.receivables || 0;
  const payables = data?.payables || 0;
  const outputGST = data?.outputGST || 0;
  const inputGST = data?.inputGST || 0;
  const monthlySales = data?.monthlySales || [];

  const profit = totalSales - totalPurchases - totalExpenses;
  const maxSales = Math.max(1, ...monthlySales.map((item) => item.sales));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-6">
        
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Main Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReportCard
            title="Total Sales"
            value={totalSales}
            icon={<ArrowDownLeft size={20} />}
            type="green"
            isLoading={isLoading}
          />

          <ReportCard
            title="Total Purchases"
            value={totalPurchases}
            icon={<ArrowUpRight size={20} />}
            type="blue"
            isLoading={isLoading}
          />

          <ReportCard
            title="Total Expenses"
            value={totalExpenses}
            icon={<FileText size={20} />}
            type="orange"
            isLoading={isLoading}
          />

          <ReportCard
            title="Net Profit"
            value={profit}
            icon={<TrendingUp size={20} />}
            type="purple"
            isLoading={isLoading}
          />
        </div>

        {/* Sales Chart */}
        <div className="mt-6 rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <BarChart3 size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">Sales Overview</h2>
              <p className="text-sm text-slate-500">
                Monthly sales and purchases
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex h-64 items-end gap-3 sm:gap-6">
              {isLoading ? (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                  Loading chart...
                </div>
              ) : monthlySales.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                  No data for the past months.
                </div>
              ) : (
                monthlySales.map((item) => {
                  const salesHeight = (item.sales / maxSales) * 100;
                  const purchaseHeight = (item.purchases / maxSales) * 100;

                  return (
                    <div
                      key={item.month}
                      className="flex flex-1 items-end justify-center gap-1"
                    >
                      <div className="flex h-full flex-col items-center justify-end">
                        <div
                          className="w-5 rounded-t-md bg-blue-600 transition hover:bg-blue-700 sm:w-8"
                          style={{ height: `${salesHeight}%` }}
                          title={`Sales ₹${item.sales.toLocaleString("en-IN")}`}
                        />

                        <span className="mt-2 text-xs text-slate-500">
                          {item.month}
                        </span>
                      </div>

                      <div className="flex h-full items-end">
                        <div
                          className="w-5 rounded-t-md bg-slate-200 sm:w-8"
                          style={{ height: `${purchaseHeight}%` }}
                          title={`Purchases ₹${item.purchases.toLocaleString("en-IN")}`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6 flex justify-center gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-blue-600" />
                Sales
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-slate-200" />
                Purchases
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Profit & Loss */}
          <div className="rounded-xl border bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2 text-green-600">
                <TrendingUp size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">Profit & Loss</h2>
                <p className="text-sm text-slate-500">Current period</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <SummaryRow label="Sales" value={totalSales} positive isLoading={isLoading} />
              <SummaryRow label="Purchases" value={totalPurchases} isLoading={isLoading} />
              <SummaryRow label="Expenses" value={totalExpenses} isLoading={isLoading} />

              <div className="border-t pt-4">
                <SummaryRow label="Net Profit" value={profit} positive bold isLoading={isLoading} />
              </div>
            </div>
          </div>

          {/* Receivable / Payable */}
          <div className="rounded-xl border bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <IndianRupee size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Outstanding Summary
                </h2>
                <p className="text-sm text-slate-500">Money movement</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <SummaryRow label="Receivables" value={receivables} positive isLoading={isLoading} />
              <SummaryRow label="Payables" value={payables} isLoading={isLoading} />

              <div className="border-t pt-4">
                <SummaryRow
                  label="Net Outstanding"
                  value={receivables - payables}
                  bold
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* GST Summary */}
        <div className="mt-6 rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
              <FileText size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">GST Summary</h2>
              <p className="text-sm text-slate-500">GST collected and paid</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <GSTCard
              title="Output GST"
              value={outputGST}
              description="GST collected from sales"
              isLoading={isLoading}
            />

            <GSTCard
              title="Input GST"
              value={inputGST}
              description="GST paid on purchases"
              isLoading={isLoading}
            />

            <GSTCard
              title="Net GST"
              value={outputGST - inputGST}
              description="Output GST − Input GST"
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function ReportCard({
  title,
  value,
  icon,
  type,
  isLoading,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  type: "green" | "blue" | "orange" | "purple";
  isLoading: boolean;
}) {
  const styles = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`rounded-lg p-2 ${styles[type]}`}>{icon}</div>
      </div>

      <p className="mt-3 text-2xl font-bold text-slate-900">
        {isLoading ? "..." : `₹${value.toLocaleString("en-IN")}`}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  positive = false,
  bold = false,
  isLoading = false,
}: {
  label: string;
  value: number;
  positive?: boolean;
  bold?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-sm ${
          bold ? "font-semibold text-slate-900" : "text-slate-500"
        }`}
      >
        {label}
      </span>

      <span
        className={`text-sm ${
          bold
            ? "font-bold text-slate-900"
            : positive
              ? "font-medium text-green-600"
              : "font-medium text-slate-700"
        }`}
      >
        {isLoading ? "..." : `₹${value.toLocaleString("en-IN")}`}
      </span>
    </div>
  );
}

function GSTCard({
  title,
  value,
  description,
  isLoading,
}: {
  title: string;
  value: number;
  description: string;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-700">{title}</p>

      <p className="mt-2 text-xl font-bold text-slate-900">
        {isLoading ? "..." : `₹${value.toLocaleString("en-IN")}`}
      </p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}
