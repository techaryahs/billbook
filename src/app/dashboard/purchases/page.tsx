"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

type PurchaseItem = {
  id: number;
  product: string;
  quantity: number;
  price: number;
  total: number;
};

type Purchase = {
  id: number;
  supplier: string;
  invoiceNo: string;
  date: string;
  total: number;
  items: number;
};

const initialPurchases: Purchase[] = [
  {
    id: 1,
    supplier: "ABC Suppliers",
    invoiceNo: "PUR-001",
    date: "26 Sep 2026",
    total: 8750,
    items: 3,
  },
  {
    id: 2,
    supplier: "Sharma Traders",
    invoiceNo: "PUR-002",
    date: "25 Sep 2026",
    total: 4200,
    items: 2,
  },
];

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);

  const [showForm, setShowForm] = useState(false);

  const [supplier, setSupplier] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState("");

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      id: Date.now(),
      product: "",
      quantity: 1,
      price: 0,
      total: 0,
    },
  ]);

  const addItem = () => {
    setItems((previous) => [
      ...previous,
      {
        id: Date.now(),
        product: "",
        quantity: 1,
        price: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (id: number) => {
    if (items.length === 1) return;

    setItems((previous) => previous.filter((item) => item.id !== id));
  };

  const updateItem = (
    id: number,
    field: keyof PurchaseItem,
    value: string | number,
  ) => {
    setItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) return item;

        const updated = {
          ...item,
          [field]: value,
        };

        const quantity =
          field === "quantity" ? Number(value) : updated.quantity;

        const price = field === "price" ? Number(value) : updated.price;

        updated.total = quantity * price;

        return updated;
      }),
    );
  };

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplier || !invoiceNo || items.length === 0) return;

    const purchase: Purchase = {
      id: Date.now(),
      supplier,
      invoiceNo,
      date: date
        ? new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
      total: grandTotal,
      items: items.length,
    };

    setPurchases((previous) => [purchase, ...previous]);

    setSupplier("");
    setInvoiceNo("");
    setDate("");

    setItems([
      {
        id: Date.now(),
        product: "",
        quantity: 1,
        price: 0,
        total: 0,
      },
    ]);

    setShowForm(false);
  };

  const totalPurchases = purchases.reduce(
    (sum, purchase) => sum + purchase.total,
    0,
  );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            New Purchase
          </button>
        </div>
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Purchases"
            value={purchases.length.toString()}
          />

          <StatCard
            title="Purchase Value"
            value={`₹${totalPurchases.toLocaleString("en-IN")}`}
          />

          <StatCard
            title="This Month"
            value={`₹${totalPurchases.toLocaleString("en-IN")}`}
          />
        </div>

        {/* Search */}
        <div className="mb-5 rounded-xl border bg-white p-4">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search supplier or invoice..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Purchase Table */}
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="hidden grid-cols-5 border-b bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Supplier</span>
            <span>Invoice</span>
            <span>Date</span>
            <span>Items</span>
            <span className="text-right">Amount</span>
          </div>

          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="grid gap-3 border-b px-6 py-4 last:border-b-0 md:grid-cols-5 md:items-center"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {purchase.supplier}
                </p>
              </div>

              <div className="text-sm text-blue-600">{purchase.invoiceNo}</div>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CalendarDays size={15} />
                {purchase.date}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <PackagePlus size={15} />
                {purchase.items}
              </div>

              <div className="text-left font-semibold text-slate-900 md:text-right">
                ₹{purchase.total.toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Purchase Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  New Purchase
                </h2>

                <p className="text-sm text-slate-500">
                  Record a purchase from your supplier
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="p-6">
              {/* Supplier Information */}
              <div className="grid gap-4 md:grid-cols-3">
                <FormInput
                  label="Supplier"
                  placeholder="ABC Suppliers"
                  value={supplier}
                  onChange={setSupplier}
                  required
                />

                <FormInput
                  label="Invoice Number"
                  placeholder="INV-001"
                  value={invoiceNo}
                  onChange={setInvoiceNo}
                  required
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Purchase Date
                  </label>

                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Purchase Items
                    </h3>

                    <p className="text-xs text-slate-500">
                      Add products received from the supplier.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid gap-3 rounded-lg border bg-slate-50 p-4 md:grid-cols-12"
                    >
                      <div className="md:col-span-5">
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Product
                        </label>

                        <input
                          type="text"
                          placeholder="Product name"
                          value={item.product}
                          onChange={(e) =>
                            updateItem(item.id, "product", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Quantity
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Purchase Price
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(item.id, "price", Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-end justify-between md:col-span-2">
                        <div>
                          <p className="text-xs text-slate-500">Total</p>

                          <p className="font-semibold text-slate-900">
                            ₹{item.total.toLocaleString("en-IN")}
                          </p>
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            title={`Remove item ${index + 1}`}
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="mt-6 flex items-center justify-between rounded-lg bg-blue-50 px-5 py-4">
                <span className="font-semibold text-slate-700">
                  Purchase Total
                </span>

                <span className="text-xl font-bold text-blue-600">
                  ₹{grandTotal.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Save Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>

      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function FormInput({
  label,
  placeholder,
  value,
  onChange,
  required = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}
