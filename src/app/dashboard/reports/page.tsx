"use client";

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

const monthlySales = [
  { month: "Apr", sales: 45000, purchases: 28000 },
  { month: "May", sales: 52000, purchases: 31000 },
  { month: "Jun", sales: 61000, purchases: 36000 },
  { month: "Jul", sales: 58000, purchases: 34000 },
  { month: "Aug", sales: 72000, purchases: 41000 },
  { month: "Sep", sales: 84500, purchases: 45900 },
];

export default function ReportsPage() {
  const totalSales = 84500;
  const totalPurchases = 45900;
  const totalExpenses = 30700;
  const receivables = 9040;
  const payables = 9950;

  const profit = totalSales - totalPurchases - totalExpenses;

  const maxSales = Math.max(...monthlySales.map((item) => item.sales));

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Main Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReportCard
            title="Total Sales"
            value={totalSales}
            icon={<ArrowDownLeft size={20} />}
            type="green"
          />

          <ReportCard
            title="Total Purchases"
            value={totalPurchases}
            icon={<ArrowUpRight size={20} />}
            type="blue"
          />

          <ReportCard
            title="Total Expenses"
            value={totalExpenses}
            icon={<FileText size={20} />}
            type="orange"
          />

          <ReportCard
            title="Net Profit"
            value={profit}
            icon={<TrendingUp size={20} />}
            type="purple"
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
              {monthlySales.map((item) => {
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
                        title={`Purchases ₹${item.purchases.toLocaleString(
                          "en-IN",
                        )}`}
                      />
                    </div>
                  </div>
                );
              })}
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
              <SummaryRow label="Sales" value={totalSales} positive />

              <SummaryRow label="Purchases" value={totalPurchases} />

              <SummaryRow label="Expenses" value={totalExpenses} />

              <div className="border-t pt-4">
                <SummaryRow label="Net Profit" value={profit} positive bold />
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
              <SummaryRow label="Receivables" value={receivables} positive />

              <SummaryRow label="Payables" value={payables} />

              <div className="border-t pt-4">
                <SummaryRow
                  label="Net Outstanding"
                  value={receivables - payables}
                  bold
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
              value={12850}
              description="GST collected from sales"
            />

            <GSTCard
              title="Input GST"
              value={7650}
              description="GST paid on purchases"
            />

            <GSTCard
              title="Net GST"
              value={5200}
              description="Output GST − Input GST"
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
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  type: "green" | "blue" | "orange" | "purple";
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
        ₹{value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  positive = false,
  bold = false,
}: {
  label: string;
  value: number;
  positive?: boolean;
  bold?: boolean;
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
        ₹{value.toLocaleString("en-IN")}
      </span>
    </div>
  );
}

function GSTCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-700">{title}</p>

      <p className="mt-2 text-xl font-bold text-slate-900">
        ₹{value.toLocaleString("en-IN")}
      </p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}
