"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Package,
  Receipt,
  ShoppingCart,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    name: "Billing",
    icon: Receipt,
    href: "/dashboard/billing",
  },
  {
    name: "Customers",
    icon: Users,
    href: "/dashboard/customers",
  },
  {
    name: "Products",
    icon: Package,
    href: "/dashboard/products",
  },
  {
    name: "Purchases",
    icon: ShoppingCart,
    href: "/dashboard/purchases",
  },
  {
    name: "Inventory",
    icon: Boxes,
    href: "/dashboard/inventory",
  },
  {
    name: "Expenses",
    icon: Wallet,
    href: "/dashboard/expenses",
  },
  {
    name: "Ledger",
    icon: FileText,
    href: "/dashboard/ledger",
  },
  {
    name: "Payments",
    icon: CreditCard,
    href: "/dashboard/receivables",
  },
  {
    name: "Reports",
    icon: BarChart3,
    href: "/dashboard/reports",
  },
  {
    name: "WhatsApp",
    icon: MessageCircle,
    href: "/dashboard/whatsapp",
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalPurchases: 0,
    receivables: 0,
    stockValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (res.ok && json.success) {
          setStats(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="w-full">
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-900">
            Business Overview
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Track your business performance from one place.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Sales"
            value={
              isLoading ? "..." : `₹${stats.totalSales.toLocaleString("en-IN")}`
            }
            description="This month"
          />

          <StatCard
            title="Purchases"
            value={
              isLoading
                ? "..."
                : `₹${stats.totalPurchases.toLocaleString("en-IN")}`
            }
            description="This month"
          />

          <StatCard
            title="Receivables"
            value={
              isLoading
                ? "..."
                : `₹${stats.receivables.toLocaleString("en-IN")}`
            }
            description="Outstanding"
          />

          <StatCard
            title="Stock Value"
            value={
              isLoading ? "..." : `₹${stats.stockValue.toLocaleString("en-IN")}`
            }
            description="Current inventory"
          />
        </div>

        {/* AI Invoice Scanner */}
        <div className="mt-6 overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50">
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Sparkles size={26} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    AI Invoice Scanner
                  </h3>

                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                    AI POWERED
                  </span>
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Upload a supplier invoice and let Aryahs automatically extract
                  products, quantities, prices, GST and invoice details.
                </p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span>✓ PDF & images</span>
                  <span>✓ Product extraction</span>
                  <span>✓ GST extraction</span>
                  <span>✓ Purchase creation</span>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard/purchases/scan"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Sparkles size={17} />
              Scan Invoice
            </Link>
          </div>
        </div>

        {/* AI Business Assistant */}
        <Link
          href="/dashboard/assistant"
          className="mt-6 block overflow-hidden rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 via-white to-indigo-50 transition hover:shadow-md hover:border-purple-200"
        >
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                <Sparkles size={26} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    AI Business Assistant
                  </h3>

                  <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                    AI POWERED
                  </span>
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Ask questions about your sales, purchases, expenses,
                  customers, inventory and payments.
                </p>
              </div>
            </div>
          </div>
        </Link>

        {/* Empty State */}
        <div className="mt-6 rounded-xl border bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <Receipt className="text-blue-600" size={26} />
          </div>

          <h3 className="text-lg font-semibold text-slate-900">
            Start your business with Aryahs
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Add your first customer, product, or invoice to start managing your
            business.
          </p>

          <Link
            href="/dashboard/billing"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Invoice
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/dashboard/customers"
            title="Add Customer"
            description="Create a new customer"
          />

          <QuickAction
            href="/dashboard/products"
            title="Add Product"
            description="Create a product"
          />

          <QuickAction
            href="/dashboard/purchases"
            title="New Purchase"
            description="Record a purchase"
          />

          <QuickAction
            href="/dashboard/expenses"
            title="Add Expense"
            description="Record an expense"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>

      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>

      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
    >
      <p className="font-semibold text-slate-900">{title}</p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </Link>
  );
}
