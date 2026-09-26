"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem("aryahs_sidebar_collapsed");
    if (savedState !== null) {
      setCollapsed(JSON.parse(savedState));
    }
  }, []);

  const handleCollapse = (value: boolean) => {
    setCollapsed(value);
    localStorage.setItem("aryahs_sidebar_collapsed", JSON.stringify(value));
  };

  // Avoid hydration mismatch by rendering a basic shell before mount, 
  // but keeping it simple enough to not jump excessively.
  // We can just render the uncollapsed state on server.
  const isCollapsed = mounted ? collapsed : false;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar 
        collapsed={isCollapsed} 
        setCollapsed={handleCollapse} 
        isMobileDrawerOpen={isMobileDrawerOpen}
        setMobileDrawerOpen={setMobileDrawerOpen}
      />
      
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardHeader setMobileDrawerOpen={setMobileDrawerOpen} />
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
