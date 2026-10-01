"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { FileText, Plus, Search, Trash2 } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  phone: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  gst: number;
};

type InvoiceItem = {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  gst: number;
};

type Invoice = {
  id: string;
  invoiceNo: string;
  customer: string;
  date: string;
  total: number;
  status: "Paid" | "Unpaid" | "Partial";
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  const [paymentStatus, setPaymentStatus] =
    useState<Invoice["status"]>("Unpaid");

  // NEW: Partial payment amount
  const [paidAmount, setPaidAmount] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([]);

  const fetchBillingData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/invoices");
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch billing data");
      }

      setInvoices(json.data.invoices || []);
      setCustomers(json.data.customers || []);
      setProducts(json.data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items],
  );

  const gstAmount = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.quantity * item.price * item.gst) / 100,
        0,
      ),
    [items],
  );

  const grandTotal = subtotal + gstAmount;

  const addProduct = (productId: string) => {
    if (!productId) return;

    const product = products.find((item) => item.id === productId);

    if (!product) return;

    const existing = items.find((item) => item.productId === product.id);

    if (existing) {
      setItems((previous) =>
        previous.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, product.stock),
              }
            : item,
        ),
      );

      return;
    }

    if (product.stock === 0) {
      alert("This product is out of stock.");
      return;
    }

    setItems((previous) => [
      ...previous,
      {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        gst: product.gst,
      },
    ]);
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    setItems((previous) =>
      previous.map((item) => {
        if (item.id !== itemId) return item;

        const product = products.find(
          (product) => product.id === item.productId,
        );

        const maxStock = product?.stock ?? quantity;

        return {
          ...item,
          quantity: Math.max(1, Math.min(quantity, maxStock)),
        };
      }),
    );
  };

  const removeItem = (itemId: number) => {
    setItems((previous) => previous.filter((item) => item.id !== itemId));
  };

  const handleCreateInvoice = async (e: FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      alert("Please select a customer.");
      return;
    }

    if (items.length === 0) {
      alert("Please add at least one product.");
      return;
    }

    const roundedGrandTotal = Math.round(grandTotal);

    // NEW: Validate partial payment
    if (paymentStatus === "Partial") {
      const numericPaidAmount = Number(paidAmount);

      if (
        !paidAmount ||
        Number.isNaN(numericPaidAmount) ||
        numericPaidAmount <= 0
      ) {
        alert("Please enter a valid paid amount for the partial payment.");
        return;
      }

      if (numericPaidAmount >= roundedGrandTotal) {
        alert(
          "For Partial payment, the paid amount must be less than the invoice total.",
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/invoices/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          customerId,

          invoiceDate,

          paymentStatus,

          // NEW: Send correct paid amount
          paidAmount:
            paymentStatus === "Partial"
              ? Number(paidAmount)
              : paymentStatus === "Paid"
                ? roundedGrandTotal
                : 0,

          items,

          invoiceNo: `INV-${String(invoices.length + 1).padStart(3, "0")}`,

          subtotal,

          gstAmount,

          total: roundedGrandTotal,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create invoice");
      }

      await fetchBillingData();

      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCustomerId("");
    setInvoiceDate("");
    setPaymentStatus("Unpaid");

    // NEW: Reset paid amount
    setPaidAmount("");

    setItems([]);
    setShowForm(false);
  };

  const totalSales = invoices.reduce((sum, invoice) => sum + invoice.total, 0);

  const outstanding = invoices
    .filter((invoice) => invoice.status !== "Paid")
    .reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Header */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Create Invoice
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Invoices"
            value={isLoading ? "..." : invoices.length.toString()}
          />

          <StatCard
            title="Total Sales"
            value={isLoading ? "..." : `₹${totalSales.toLocaleString("en-IN")}`}
          />

          <StatCard
            title="Outstanding"
            value={
              isLoading ? "..." : `₹${outstanding.toLocaleString("en-IN")}`
            }
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
              placeholder="Search invoice or customer..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Invoice List */}
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="hidden grid-cols-5 border-b bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Invoice</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Status</span>
            <span className="text-right">Amount</span>
          </div>

          {isLoading ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />

              <p className="mt-4 text-sm text-slate-500">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FileText size={40} className="mx-auto text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No invoices found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create your first invoice to start billing customers.
              </p>
            </div>
          ) : (
            invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="grid gap-3 border-b px-6 py-4 last:border-b-0 md:grid-cols-5 md:items-center"
              >
                <div className="flex items-center gap-2">
                  <FileText size={17} className="text-blue-600" />

                  <span className="font-semibold text-blue-600">
                    {invoice.invoiceNo}
                  </span>
                </div>

                <div className="font-medium text-slate-900">
                  {invoice.customer}
                </div>

                <div className="text-sm text-slate-500">
                  {new Intl.DateTimeFormat("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(invoice.date))}
                </div>

                <div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      invoice.status === "Paid"
                        ? "bg-green-50 text-green-600"
                        : invoice.status === "Partial"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-red-50 text-red-600"
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>

                <div className="font-semibold text-slate-900 md:text-right">
                  ₹{invoice.total.toLocaleString("en-IN")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Create Invoice
                </h2>

                <p className="text-sm text-slate-500">
                  Create a GST or non-GST sales invoice
                </p>
              </div>

              <button
                onClick={resetForm}
                disabled={isSubmitting}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6">
              {/* Customer / Date / Payment Status */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Customer */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Customer
                  </label>

                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select customer</option>

                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Invoice Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Invoice Date
                  </label>

                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Payment Status */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Payment Status
                  </label>

                  <select
                    value={paymentStatus}
                    onChange={(e) => {
                      const value = e.target.value as Invoice["status"];

                      setPaymentStatus(value);

                      // Clear partial amount when
                      // switching away from Partial.
                      if (value !== "Partial") {
                        setPaidAmount("");
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Paid">Paid</option>

                    <option value="Unpaid">Unpaid</option>

                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>

              {/* ================================================= */}
              {/* PARTIAL PAYMENT AMOUNT */}
              {/* ================================================= */}

              {paymentStatus === "Partial" && (
                <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Paid Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="Enter paid amount"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    Invoice total: ₹
                    {Math.round(grandTotal).toLocaleString("en-IN")}
                  </p>

                  {paidAmount &&
                    Number(paidAmount) > 0 &&
                    Number(paidAmount) < Math.round(grandTotal) && (
                      <p className="mt-2 text-xs font-medium text-yellow-700">
                        Outstanding after payment: ₹
                        {(
                          Math.round(grandTotal) - Number(paidAmount)
                        ).toLocaleString("en-IN")}
                      </p>
                    )}
                </div>
              )}

              {/* Product */}
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Invoice Items
                    </h3>

                    <p className="text-xs text-slate-500">
                      Select products to add to the invoice.
                    </p>
                  </div>

                  <select
                    defaultValue=""
                    onChange={(e) => {
                      addProduct(e.target.value);

                      e.target.value = "";
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">+ Add Product</option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                        disabled={product.stock <= 0}
                      >
                        {product.name} — ₹{product.price} — Stock:{" "}
                        {product.stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="overflow-hidden rounded-lg border">
                  {items.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <FileText size={35} className="mx-auto text-slate-300" />

                      <p className="mt-3 text-sm text-slate-500">
                        No products added yet.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="hidden grid-cols-6 border-b bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 md:grid">
                        <span className="col-span-2">Product</span>

                        <span>Price</span>

                        <span>Qty</span>

                        <span>GST</span>

                        <span className="text-right">Total</span>
                      </div>

                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="grid gap-3 border-b p-4 last:border-b-0 md:grid-cols-6 md:items-center"
                        >
                          <div className="md:col-span-2">
                            <p className="font-semibold text-slate-900">
                              {item.productName}
                            </p>

                            <p className="text-xs text-slate-500">
                              GST {item.gst}%
                            </p>
                          </div>

                          <div className="text-sm">
                            ₹{item.price.toLocaleString("en-IN")}
                          </div>

                          <div>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.id, Number(e.target.value))
                              }
                              className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="text-sm text-slate-600">
                            {item.gst}%
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-semibold">
                              ₹
                              {(
                                item.quantity *
                                item.price *
                                (1 + item.gst / 100)
                              ).toLocaleString("en-IN")}
                            </span>

                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 ml-auto max-w-sm rounded-xl border bg-slate-50 p-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>

                  <span className="font-medium">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-slate-500">GST</span>

                  <span className="font-medium">
                    ₹{gstAmount.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="my-4 border-t" />

                <div className="flex justify-between">
                  <span className="font-semibold">Grand Total</span>

                  <span className="text-xl font-bold text-blue-600">
                    ₹{Math.round(grandTotal).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Payment summary */}
                {paymentStatus === "Partial" &&
                  paidAmount &&
                  Number(paidAmount) > 0 && (
                    <>
                      <div className="my-4 border-t" />

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Paid</span>

                        <span className="font-semibold text-green-600">
                          ₹{Number(paidAmount).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-slate-500">Outstanding</span>

                        <span className="font-semibold text-red-600">
                          ₹
                          {Math.max(
                            0,
                            Math.round(grandTotal) - Number(paidAmount),
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </>
                  )}

                {paymentStatus === "Paid" && (
                  <>
                    <div className="my-4 border-t" />

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Paid</span>

                      <span className="font-semibold text-green-600">
                        ₹{Math.round(grandTotal).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-slate-500">Outstanding</span>

                      <span className="font-semibold text-green-600">₹0</span>
                    </div>
                  </>
                )}

                {paymentStatus === "Unpaid" && (
                  <>
                    <div className="my-4 border-t" />

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Paid</span>

                      <span className="font-semibold">₹0</span>
                    </div>

                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-slate-500">Outstanding</span>

                      <span className="font-semibold text-red-600">
                        ₹{Math.round(grandTotal).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Invoice"}
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
