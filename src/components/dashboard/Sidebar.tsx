"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
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
  PanelLeftClose,
  PanelLeftOpen,
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

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  isMobileDrawerOpen,
  setMobileDrawerOpen,
}: SidebarProps) {
  const pathname = usePathname();

  const handleMobileClick = () => {
    if (isMobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-white transition-all duration-300 lg:static lg:block ${
          isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "w-[72px]" : "w-64"}`}
      >
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden" onClick={handleMobileClick}>
            <h1 className="text-xl font-bold text-blue-600">
              {collapsed ? "AR" : "ARYAHS"}
            </h1>
            {!collapsed && (
              <p className="text-xs text-slate-400 whitespace-nowrap">Business Manager</p>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleMobileClick}
                className={`flex w-full items-center rounded-lg py-3 text-sm font-medium transition ${
                  collapsed ? "justify-center px-0" : "gap-3 px-4"
                } ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                }`}
                title={collapsed ? item.name : undefined}
              >
                <Icon size={19} className="shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4 flex flex-col gap-2">
          <Link
            href="/dashboard/settings"
            onClick={handleMobileClick}
            className={`flex w-full items-center rounded-lg py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition ${
              collapsed ? "justify-center px-0" : "gap-3 px-4"
            } ${pathname === "/dashboard/settings" ? "bg-blue-50 text-blue-600" : ""}`}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings size={19} className="shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
          
          {/* Collapse Toggle (hidden on mobile, only relevant for desktop) */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex w-full items-center rounded-lg py-3 text-sm text-slate-500 hover:bg-slate-100 transition ${
              collapsed ? "justify-center px-0" : "gap-3 px-4"
            }`}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <PanelLeftOpen size={19} className="shrink-0" />
            ) : (
              <>
                <PanelLeftClose size={19} className="shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
