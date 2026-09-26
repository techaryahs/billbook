"use client";

import Link from "next/link";
import {
  BarChart3,
  Bell,
  Boxes,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
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
  return (
    <div className="w-full">
      
        {/* Sidebar */}
        

        {/* Main */}
        
          

          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold">Business Overview</h3>

              <p className="mt-1 text-sm text-slate-500">
                Track your business performance from one place.
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Sales"
                value="₹0"
                description="This month"
              />

              <StatCard title="Purchases" value="₹0" description="This month" />

              <StatCard
                title="Receivables"
                value="₹0"
                description="Outstanding"
              />

              <StatCard
                title="Stock Value"
                value="₹0"
                description="Current inventory"
              />
            </div>

            {/* Empty State */}
            <div className="mt-6 rounded-xl border bg-white p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                <Receipt className="text-blue-600" size={26} />
              </div>

              <h3 className="text-lg font-semibold">
                Start your business with Aryahs
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Add your first customer, product, or invoice to start managing
                your business.
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

      <p className="mt-2 text-2xl font-bold">{value}</p>

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
