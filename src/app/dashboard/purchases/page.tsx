"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  PackagePlus,
  Plus,
  Search,
  Sparkles,
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
  id: string;
  supplier: string;
  invoiceNo: string;
  date: string;
  total: number;
  items: number;
  status?: string;
};

type ManualItem = {
  id: number;
  product: string;
  quantity: number;
  price: number;
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [search, setSearch] = useState("");

  const [supplier, setSupplier] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");

  const [items, setItems] = useState<ManualItem[]>([
    {
      id: Date.now(),
      product: "",
      quantity: 1,
      price: 0,
    },
  ]);

  /**
   * Load purchases from database
   */
  const loadPurchases = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/purchases", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load purchases");
      }

      setPurchases(result.data || []);
    } catch (error) {
      console.error("Load purchases error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  /**
   * Add manual item
   */
  const addItem = () => {
    setItems((previous) => [
      ...previous,
      {
        id: Date.now(),
        product: "",
        quantity: 1,
        price: 0,
      },
    ]);
  };

  /**
   * Update manual item
   */
  const updateItem = (
    id: number,
    field: keyof ManualItem,
    value: string | number,
  ) => {
    setItems((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "quantity" || field === "price"
                  ? Number(value)
                  : value,
            }
          : item,
      ),
    );
  };

  /**
   * Remove manual item
   */
  const removeItem = (id: number) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
  };

  /**
   * Calculate total
   */
  const grandTotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.price),
      0,
    );
  }, [items]);

  /**
   * Create manual purchase
   */
  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplier.trim()) {
      alert("Please enter supplier name.");
      return;
    }

    if (!invoiceNo.trim()) {
      alert("Please enter invoice number.");
      return;
    }

    if (items.length === 0) {
      alert("Please add at least one item.");
      return;
    }

    const invalidItem = items.find(
      (item) => !item.product.trim() || item.quantity <= 0 || item.price < 0,
    );

    if (invalidItem) {
      alert("Please enter valid product, quantity and price for every item.");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/purchases/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplierName: supplier.trim(),
          purchaseNumber: invoiceNo.trim(),
          purchaseDate: new Date().toISOString(),

          subtotal: grandTotal,
          discount: 0,
          taxableAmount: grandTotal,
          cgst: 0,
          sgst: 0,
          igst: 0,
          total: grandTotal,

          items: items.map((item) => ({
            productName: item.product.trim(),
            quantity: Number(item.quantity),
            unitPrice: Number(item.price),
            unit: "PCS",
            discount: 0,
            gstRate: 0,
            taxableAmount: Number(item.quantity) * Number(item.price),
            cgst: 0,
            sgst: 0,
            igst: 0,
            total: Number(item.quantity) * Number(item.price),
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.details
            ? `${result.message}: ${result.details}`
            : result.message || "Unable to create purchase",
        );
      }

      setSupplier("");
      setInvoiceNo("");

      setItems([
        {
          id: Date.now(),
          product: "",
          quantity: 1,
          price: 0,
        },
      ]);

      setShowForm(false);

      await loadPurchases();
    } catch (error) {
      console.error("Create purchase error:", error);

      alert(
        error instanceof Error ? error.message : "Unable to create purchase",
      );
    } finally {
      setCreating(false);
    }
  };

  /**
   * Filter purchases
   */
  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return purchases;
    }

    return purchases.filter((purchase) => {
      return (
        purchase.supplier.toLowerCase().includes(query) ||
        purchase.invoiceNo.toLowerCase().includes(query)
      );
    });
  }, [purchases, search]);

  /**
   * Total purchase value
   */
  const totalPurchases = useMemo(() => {
    return purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  }, [purchases]);

  /**
   * Current month purchases
   */
  const monthlyPurchases = useMemo(() => {
    const now = new Date();

    return purchases
      .filter((purchase) => {
        const date = new Date(purchase.date);

        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, purchase) => sum + purchase.total, 0);
  }, [purchases]);

  /**
   * Format currency
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Format date
   */
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>

            <span>/</span>

            <span>Purchases</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your purchases, suppliers and stock entries.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/purchases/scan"
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Sparkles className="h-4 w-4" />
            AI Invoice Scanner
          </Link>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            New Purchase
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Total Purchases</p>

            <PackagePlus className="h-5 w-5 text-gray-400" />
          </div>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(totalPurchases)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">This Month</p>

            <CalendarDays className="h-5 w-5 text-gray-400" />
          </div>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(monthlyPurchases)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Purchase Entries
            </p>

            <PackagePlus className="h-5 w-5 text-gray-400" />
          </div>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {purchases.length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplier or invoice number..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
          />
        </div>
      </div>

      {/* Purchases table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Purchase History</h2>

          <p className="mt-1 text-sm text-gray-500">
            Purchases saved in your Aryahs business account.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center px-5 py-16">
            <div className="text-sm text-gray-500">Loading purchases...</div>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <PackagePlus className="h-6 w-6 text-gray-400" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-900">
              {search ? "No purchases found" : "No purchases yet"}
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              {search
                ? "Try a different supplier or invoice number."
                : "Create a purchase manually or scan a supplier invoice using AI."}
            </p>

            {!search && (
              <div className="mt-5 flex gap-2">
                <Link
                  href="/dashboard/purchases/scan"
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Scan Invoice
                </Link>

                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  New Purchase
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Supplier</th>

                  <th className="px-5 py-3">Invoice</th>

                  <th className="px-5 py-3">Date</th>

                  <th className="px-5 py-3">Items</th>

                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="transition hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        {purchase.supplier}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {purchase.invoiceNo}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {formatDate(purchase.date)}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {purchase.items}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(purchase.total)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Purchase Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  New Purchase
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add a purchase manually.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreatePurchase} className="space-y-6 p-6">
              {/* Supplier / invoice */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Supplier
                  </label>

                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Supplier name"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Invoice Number
                  </label>

                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="PUR-001"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Items</h3>

                    <p className="text-xs text-gray-500">
                      Add products received from the supplier.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={item.product}
                          onChange={(e) =>
                            updateItem(item.id, "product", e.target.value)
                          }
                          placeholder="Product name"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", e.target.value)
                          }
                          placeholder="Qty"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(item.id, "price", e.target.value)
                          }
                          placeholder="Price"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                        />
                      </div>

                      <div className="col-span-2 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total</span>

                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={creating}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating Purchase..." : "Create Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
