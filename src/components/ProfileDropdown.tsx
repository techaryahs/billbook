"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ChevronDown, LogOut, Settings, User } from "lucide-react";

type ProfileData = {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  business: {
    id: string;
    name: string;
    gstin: string | null;
    phone: string | null;
    email: string | null;
    role: string;
  } | null;
};

export default function ProfileDropdown() {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        
        if (!res.ok || !json.success) {
          router.push("/login");
          return;
        }
        
        setData(json);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-100"></div>
    );
  }

  if (!data) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 pr-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-xs font-bold text-blue-700">
          {getInitials(data.user.name)}
        </div>
        <span className="hidden sm:inline-block max-w-[100px] truncate">{data.user.name.split(" ")[0]}</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-lg outline-none z-50">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
              {getInitials(data.user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">
                {data.user.name}
              </p>
              <p className="truncate text-xs text-slate-500">
                {data.user.email}
              </p>
            </div>
          </div>

          <div className="my-1 h-px bg-slate-100" />

          {/* Business Info */}
          {data.business && (
            <div className="p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Building2 size={12} />
                Business
              </div>
              <p className="mt-2 truncate font-medium text-slate-900">
                {data.business.name}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-blue-600">
                {data.business.role}
              </p>
              
              {data.business.gstin && (
                <p className="mt-1 text-xs text-slate-500">
                  GST: {data.business.gstin}
                </p>
              )}
            </div>
          )}

          <div className="my-1 h-px bg-slate-100" />

          {/* Menu Items */}
          <div className="p-1 space-y-0.5">
            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <User size={16} />
              My Profile
            </Link>
            
            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Building2 size={16} />
              Business Settings
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Settings size={16} />
              Settings
            </Link>
          </div>

          <div className="my-1 h-px bg-slate-100" />

          {/* Logout */}
          <div className="p-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
