import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  FileText,
  MessageCircle,
  Package,
  Receipt,
  ScanLine,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import Navbar from "@/components/Navbar";

const features = [
  {
    icon: Receipt,
    title: "Smart Billing",
    description:
      "Create GST and non-GST invoices quickly with a simple billing workflow.",
  },
  {
    icon: Users,
    title: "Customer Management",
    description:
      "Manage customers, contact details, outstanding balances and transaction history.",
  },
  {
    icon: Package,
    title: "Product Management",
    description:
      "Maintain products, pricing, SKU, barcode and stock information in one place.",
  },
  {
    icon: Boxes,
    title: "Inventory",
    description:
      "Track stock movement, available quantities and low-stock products.",
  },
  {
    icon: Wallet,
    title: "Expenses",
    description:
      "Record business expenses and understand where your money is going.",
  },
  {
    icon: BarChart3,
    title: "Reports",
    description:
      "See sales, purchases, expenses, profit and business performance.",
  },
  {
    icon: Sparkles,
    title: "AI Business Assistant",
    description:
      "Ask questions about your sales, purchases, expenses, customers, inventory and payments.",
  },
];

const aiFeatures = [
  {
    icon: ScanLine,
    title: "AI Invoice Scanner",
    description:
      "Upload a supplier invoice and let AI extract supplier, products, GST, quantities and totals.",
  },
  {
    icon: MessageCircle,
    title: "AI WhatsApp Billing",
    description:
      "Create an order or invoice using a simple natural-language WhatsApp message.",
  },
  {
    icon: TrendingUp,
    title: "AI Business Assistant",
    description:
      "Ask questions about your business and get useful insights from your business data.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-50">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute -right-32 top-32 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600">
              <Sparkles size={16} />
              Smart business management for Indian businesses
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Run your business
              <span className="block text-blue-600">smarter with Aryahs</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Billing, inventory, customers, purchases, expenses, payments and
              business insights — all in one simple platform.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Start for Free
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Login to Aryahs
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                Simple to use
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                GST ready
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                AI powered
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-blue-100">
              {/* Fake browser header */}
              <div className="flex items-center gap-2 border-b bg-slate-50 px-5 py-3">
                <span className="h-3 w-3 rounded-full bg-red-300" />
                <span className="h-3 w-3 rounded-full bg-yellow-300" />
                <span className="h-3 w-3 rounded-full bg-green-300" />

                <div className="ml-4 h-7 flex-1 rounded-md bg-white" />
              </div>

              <div className="flex min-h-[350px]">
                {/* Preview Sidebar */}
                <div className="hidden w-48 border-r bg-white p-4 sm:block">
                  <div className="mb-6">
                    <p className="font-bold text-blue-600">ARYAHS</p>
                    <p className="text-[9px] text-slate-400">
                      Business Manager
                    </p>
                  </div>

                  {[
                    "Dashboard",
                    "Billing",
                    "Customers",
                    "Products",
                    "Inventory",
                    "Reports",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className={`mb-1 rounded-lg px-3 py-2 text-xs ${
                        index === 0
                          ? "bg-blue-50 font-semibold text-blue-600"
                          : "text-slate-500"
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>

                {/* Preview Content */}
                <div className="flex-1 bg-slate-50 p-5">
                  <div className="mb-5">
                    <p className="text-lg font-bold">Business Overview</p>

                    <p className="text-xs text-slate-400">
                      Track your business performance
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["Total Sales", "₹84,500"],
                      ["Purchases", "₹45,900"],
                      ["Receivables", "₹9,040"],
                      ["Stock Value", "₹1,25,000"],
                    ].map(([title, value]) => (
                      <div
                        key={title}
                        className="rounded-xl border bg-white p-4"
                      >
                        <p className="text-[11px] text-slate-400">{title}</p>

                        <p className="mt-2 text-lg font-bold">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border bg-white p-5 lg:col-span-2">
                      <p className="text-sm font-semibold">Sales Overview</p>

                      <div className="mt-6 flex h-36 items-end gap-3">
                        {[35, 50, 42, 65, 58, 80, 95].map((height, index) => (
                          <div key={index} className="flex flex-1 items-end">
                            <div
                              className="w-full rounded-t-md bg-blue-500"
                              style={{
                                height: `${height}%`,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border bg-white p-5">
                      <p className="text-sm font-semibold">Quick Actions</p>

                      <div className="mt-4 space-y-2">
                        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-600">
                          Create Invoice
                        </div>

                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          Add Customer
                        </div>

                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          Add Product
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-blue-600">
              EVERYTHING IN ONE PLACE
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything your business needs
            </h2>

            <p className="mt-4 text-slate-500">
              Manage your daily business operations without jumping between
              multiple tools.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={21} />
                  </div>

                  <h3 className="mt-5 font-semibold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-blue-600">HOW IT WORKS</p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Start managing your business in minutes
            </h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Create your account",
                description:
                  "Register your business and complete your basic business setup.",
              },
              {
                number: "02",
                title: "Add your business data",
                description:
                  "Add customers, products, suppliers and opening stock.",
              },
              {
                number: "03",
                title: "Start managing",
                description:
                  "Create invoices, record purchases, track payments and monitor your business.",
              },
            ].map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {step.number}
                </div>

                <h3 className="mt-5 font-semibold">{step.title}</h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI */}
      <section id="ai" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
                <Sparkles size={16} />
                AI Powered
              </div>

              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Your business,
                <span className="text-blue-600"> powered by AI</span>
              </h2>

              <p className="mt-5 leading-7 text-slate-500">
                Aryahs is designed to go beyond traditional billing software by
                using AI to reduce manual work and help business owners
                understand their business.
              </p>

              <Link
                href="/register"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Get Started
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="grid gap-4">
              {aiFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="flex gap-4 rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon size={21} />
                    </div>

                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to simplify your business?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-blue-100">
            Create your Aryahs account and start managing your business from one
            place.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Create Free Account
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-blue-600">ARYAHS</p>

            <p className="mt-1 text-xs text-slate-400">
              Business management made simple.
            </p>
          </div>

          <div className="flex gap-5 text-sm text-slate-500">
            <Link href="/login" className="hover:text-blue-600">
              Login
            </Link>

            <Link href="/register" className="hover:text-blue-600">
              Register
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Aryahs
          </p>
        </div>
      </footer>
    </main>
  );
}
