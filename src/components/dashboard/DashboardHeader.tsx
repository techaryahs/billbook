"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import ProfileDropdown from "@/components/ProfileDropdown";

const ROUTE_INFO: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Welcome back to Aryahs" },
  "/dashboard/billing": { title: "Billing", subtitle: "Create and manage sales invoices" },
  "/dashboard/customers": { title: "Customers", subtitle: "Manage your customers and their outstanding payments" },
  "/dashboard/products": { title: "Products", subtitle: "Manage products, pricing and stock" },
  "/dashboard/purchases": { title: "Purchases", subtitle: "Manage supplier purchases and stock purchases" },
  "/dashboard/inventory": { title: "Inventory", subtitle: "Monitor stock and inventory movements" },
  "/dashboard/expenses": { title: "Expenses", subtitle: "Track and manage your business expenses" },
  "/dashboard/ledger": { title: "Ledger", subtitle: "Track all business financial transactions" },
  "/dashboard/receivables": { title: "Payments", subtitle: "Track money you need to receive and pay" },
  "/dashboard/reports": { title: "Reports", subtitle: "Understand your business performance" },
  "/dashboard/whatsapp": { title: "WhatsApp", subtitle: "Send invoices and payment reminders" },
  "/dashboard/settings": { title: "Settings", subtitle: "Manage your business and account settings" },
};

interface DashboardHeaderProps {
  setMobileDrawerOpen: (open: boolean) => void;
}

export default function DashboardHeader({ setMobileDrawerOpen }: DashboardHeaderProps) {
  const pathname = usePathname();
  
  const info = ROUTE_INFO[pathname] || { title: "Dashboard", subtitle: "Aryahs Business Manager" };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none"
        >
          <Menu size={20} />
        </button>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">{info.title}</h2>
          <p className="hidden md:block text-xs text-slate-500">{info.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
        >
          <Bell size={20} />
        </button>
        <ProfileDropdown />
      </div>
    </header>
  );
}
