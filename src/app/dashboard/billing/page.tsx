"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { FileText, Plus, Search, Trash2, Check, ChevronsUpDown, X, MoreVertical, Eye, Edit2 } from "lucide-react";
import { useRef } from "react";

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
  status: "Paid" | "Unpaid" | "Partial" | "Cancelled" | "Sent" | "Draft";
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState("");

  const [paymentStatus, setPaymentStatus] =
    useState<Invoice["status"]>("Unpaid");

  // NEW: Partial payment amount
  const [paidAmount, setPaidAmount] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([]);

  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editingInvoiceNo, setEditingInvoiceNo] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenuId(null);
        if (isViewing) setIsViewing(false);
      }
    };
    const handleClickOutside = () => setActiveMenuId(null);
    
    if (activeMenuId || isViewing) {
      document.addEventListener("keydown", handleKeyDown);
    }
    if (activeMenuId) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [activeMenuId, isViewing]);

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
      const url = editingInvoiceId ? `/api/invoices/${editingInvoiceId}` : "/api/invoices/create";
      const method = editingInvoiceId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
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
          invoiceNo: editingInvoiceNo || `INV-${String(invoices.length + 1).padStart(3, "0")}`,
          subtotal,
          gstAmount,
          total: roundedGrandTotal,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || `Failed to ${editingInvoiceId ? "update" : "create"} invoice`);
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
    setPaidAmount("");
    setItems([]);
    setEditingInvoiceId(null);
    setEditingInvoiceNo(null);
    setShowForm(false);
  };

  const openViewForm = async (invoiceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to fetch invoice details");
      
      setViewingInvoice(json.data);
      setIsViewing(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load invoice for viewing.");
    } finally {
      setIsLoading(false);
      setActiveMenuId(null);
    }
  };

  const openEditForm = async (invoiceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to fetch invoice details");
      
      const inv = json.data;
      setEditingInvoiceId(inv.id);
      setEditingInvoiceNo(inv.invoiceNumber);
      
      setCustomerId(inv.customerId || "");
      setInvoiceDate(inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : "");
      
      let mappedStatus: Invoice["status"] = "Unpaid";
      if (inv.status === "PAID") mappedStatus = "Paid";
      else if (inv.status === "PARTIALLY_PAID") mappedStatus = "Partial";
      setPaymentStatus(mappedStatus);
      
      setPaidAmount(inv.paidAmount ? String(inv.paidAmount) : "");
      
      setItems(inv.items.map((item: any) => ({
        id: item.id || Date.now() + Math.random(),
        productId: item.productId,
        productName: item.productName,
        quantity: Number(item.quantity),
        price: Number(item.unitPrice),
        gst: Number(item.gstRate),
      })));
      
      setShowForm(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load invoice for editing.");
    } finally {
      setIsLoading(false);
      setActiveMenuId(null);
    }
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
        <div className="rounded-xl border bg-white">
          <div className="hidden grid-cols-6 border-b bg-slate-50 rounded-t-xl px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span className="col-span-1">Invoice</span>
            <span className="col-span-1">Customer</span>
            <span className="col-span-1">Date</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-1 text-right">Amount</span>
            <span className="col-span-1 text-right">Action</span>
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
            invoices.map((invoice, index) => {
              const isNearBottom = index >= invoices.length - 2 && invoices.length > 2;
              
              return (
              <div
                key={invoice.id}
                className="grid gap-3 border-b px-6 py-4 last:border-b-0 last:rounded-b-xl md:grid-cols-6 md:items-center relative"
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
                          : invoice.status === "Cancelled"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-red-50 text-red-600"
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>

                <div className="font-semibold text-slate-900 md:text-right">
                  ₹{invoice.total.toLocaleString("en-IN")}
                </div>

                <div className="flex items-center justify-end">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === invoice.id ? null : invoice.id);
                      }}
                      className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {activeMenuId === invoice.id && (
                      <div 
                        className={`absolute right-0 z-50 w-40 rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/50 ${isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                        onMouseLeave={() => setActiveMenuId(null)}
                      >
                        <div className="p-1">
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              openEditForm(invoice.id);
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 size={16} /> Edit Invoice
                          </button>
                          
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              openViewForm(invoice.id);
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                          >
                            <Eye size={16} /> View Invoice
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )})
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
                  {editingInvoiceId ? `Edit Invoice #${editingInvoiceNo}` : "Create Invoice"}
                </h2>

                <p className="text-sm text-slate-500">
                  {editingInvoiceId ? "Modify your existing invoice" : "Create a GST or non-GST sales invoice"}
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
                <div className="relative">
                  <CustomerSelectDropdown
                    customers={customers}
                    value={customerId}
                    onChange={setCustomerId}
                    onAddCustomer={() => setShowAddCustomerModal(true)}
                  />
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
                  {isSubmitting ? (editingInvoiceId ? "Updating..." : "Saving...") : (editingInvoiceId ? "Update Invoice" : "Save Invoice")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <AddCustomerModal 
          customers={customers}
          onClose={() => setShowAddCustomerModal(false)}
          onSuccess={(newCustomer: Customer) => {
            setCustomers((prev) => [newCustomer, ...prev]);
            setCustomerId(newCustomer.id);
            setShowAddCustomerModal(false);
          }}
        />
      )}
      {/* View Invoice Modal */}
      {isViewing && viewingInvoice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm sm:px-6">
          <div className="flex h-full w-full max-w-4xl flex-col rounded-2xl bg-slate-50 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Invoice Preview
                </h2>
                <p className="text-sm text-slate-500">
                  {viewingInvoice.invoiceNumber}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsViewing(false);
                  setViewingInvoice(null);
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Document Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="mx-auto w-full max-w-3xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                {/* Invoice Top */}
                <div className="flex flex-col justify-between border-b pb-8 sm:flex-row sm:items-start">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                      {viewingInvoice.business?.name || "ARYAHS"}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 font-medium">
                      Business Manager
                    </p>
                    {viewingInvoice.business?.email && <p className="text-sm text-slate-500 mt-2">{viewingInvoice.business.email}</p>}
                    {viewingInvoice.business?.phone && <p className="text-sm text-slate-500">{viewingInvoice.business.phone}</p>}
                  </div>
                  <div className="mt-6 text-left sm:mt-0 sm:text-right">
                    <h2 className="text-xl font-bold text-slate-800">INVOICE</h2>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      #{viewingInvoice.invoiceNumber}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Date: {new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(viewingInvoice.invoiceDate))}
                    </p>
                    {viewingInvoice.dueDate && (
                      <p className="text-sm text-slate-500">
                        Due: {new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(viewingInvoice.dueDate))}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bill To */}
                <div className="mt-8">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Bill To
                  </h3>
                  <div className="text-sm">
                    <p className="text-base font-bold text-slate-900">{viewingInvoice.customer?.name || "Unknown Customer"}</p>
                    {viewingInvoice.customer?.phone && <p className="text-slate-600 mt-1">{viewingInvoice.customer.phone}</p>}
                    {viewingInvoice.customer?.email && <p className="text-slate-600">{viewingInvoice.customer.email}</p>}
                    {(viewingInvoice.customer?.billingAddress || viewingInvoice.customer?.city) && (
                      <p className="text-slate-600 whitespace-pre-wrap mt-1">
                        {[viewingInvoice.customer?.billingAddress, viewingInvoice.customer?.city, viewingInvoice.customer?.state, viewingInvoice.customer?.pincode].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {viewingInvoice.customer?.gstin && <p className="text-slate-600 mt-1">GSTIN: <span className="font-medium">{viewingInvoice.customer.gstin}</span></p>}
                  </div>
                </div>

                {/* Items Table */}
                <div className="mt-10 overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-900 text-slate-900">
                        <th className="py-3 font-bold uppercase tracking-wider text-xs">Item</th>
                        <th className="py-3 text-center font-bold uppercase tracking-wider text-xs">Qty</th>
                        <th className="py-3 text-right font-bold uppercase tracking-wider text-xs">Rate</th>
                        <th className="py-3 text-right font-bold uppercase tracking-wider text-xs">GST</th>
                        <th className="py-3 text-right font-bold uppercase tracking-wider text-xs">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingInvoice.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="py-4 font-medium text-slate-900">{item.productName}</td>
                          <td className="py-4 text-center text-slate-600">{Number(item.quantity)}</td>
                          <td className="py-4 text-right text-slate-600">₹{Number(item.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td className="py-4 text-right text-slate-600">{Number(item.gstRate)}%</td>
                          <td className="py-4 text-right font-medium text-slate-900">₹{Number(item.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-8 flex flex-col items-end border-t pt-6">
                  <div className="w-full max-w-xs space-y-3 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>₹{Number(viewingInvoice.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST Amount</span>
                      <span>₹{(Number(viewingInvoice.cgst) + Number(viewingInvoice.sgst) + Number(viewingInvoice.igst)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-900">
                      <span>Grand Total</span>
                      <span>₹{Number(viewingInvoice.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Status Block */}
                <div className="mt-12 rounded-xl bg-slate-50 p-6 border border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Payment Information
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${
                          viewingInvoice.status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : viewingInvoice.status === "PARTIALLY_PAID"
                              ? "bg-yellow-100 text-yellow-700"
                              : viewingInvoice.status === "CANCELLED"
                                ? "bg-slate-200 text-slate-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {viewingInvoice.status === "PAID" ? "Paid" : viewingInvoice.status === "PARTIALLY_PAID" ? "Partial" : viewingInvoice.status === "CANCELLED" ? "Cancelled" : "Unpaid"}
                      </span>
                    </div>
                    
                    <div className="flex gap-6 text-sm">
                      <div className="flex flex-col">
                        <span className="text-slate-500">Paid Amount</span>
                        <span className="font-bold text-slate-900 mt-0.5">₹{Number(viewingInvoice.paidAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500">Outstanding</span>
                        <span className="font-bold text-red-600 mt-0.5">₹{Math.max(0, Number(viewingInvoice.total) - Number(viewingInvoice.paidAmount)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-white px-6 py-4 rounded-b-2xl flex justify-between items-center">
              <button
                onClick={() => {
                  setIsViewing(false);
                  setViewingInvoice(null);
                }}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Print
                </button>
                <button
                  disabled
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
                  title="PDF generation is currently being integrated"
                >
                  Download PDF
                </button>
              </div>
            </div>
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

function CustomerSelectDropdown({ customers, value, onChange, onAddCustomer }: {
  customers: Customer[],
  value: string,
  onChange: (val: string) => void,
  onAddCustomer: () => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  const selectedCustomer = customers.find(c => c.id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Customer
      </label>
      
      <div 
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        {selectedCustomer ? (
          <div className="flex flex-col text-left">
            <span className="font-semibold text-slate-900">{selectedCustomer.name}</span>
            {selectedCustomer.phone && <span className="text-xs text-slate-500">{selectedCustomer.phone}</span>}
          </div>
        ) : (
          <span className="text-slate-400">Select customer</span>
        )}
        <ChevronsUpDown size={16} className="text-slate-400 shrink-0 ml-2" />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search customer..." 
                className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-slate-200 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onAddCustomer();
              }}
              className="w-full text-left px-3 py-2.5 text-sm text-blue-600 font-semibold hover:bg-blue-50 rounded-md flex items-center gap-2 transition-colors"
            >
              <Plus size={16} /> Add New Customer
            </button>
            
            <div className="my-1 border-t border-slate-100" />
            
            {filteredCustomers.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate-500">
                No customers found.
              </div>
            ) : (
              filteredCustomers.map(customer => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    onChange(customer.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-md flex justify-between items-center transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{customer.name}</span>
                    {customer.phone && <span className="text-xs text-slate-500">{customer.phone}</span>}
                  </div>
                  {value === customer.id && <Check size={16} className="text-blue-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AddCustomerModal({ customers, onClose, onSuccess }: { customers: Customer[], onClose: () => void, onSuccess: (c: Customer) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Customer Name is required.");
      return;
    }
    
    if (phone.trim()) {
      const duplicate = customers.find(c => c.phone === phone.trim());
      if (duplicate) {
        setError(`A customer named "${duplicate.name}" already exists with this phone number. Please select them from the list or use a different phone number.`);
        return;
      }
    }
    
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, billingAddress: address, city })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to create customer");
      
      onSuccess(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create customer. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add New Customer</h2>
            <p className="text-sm text-slate-500">Add a customer without leaving your invoice.</p>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSaving} 
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6">
          <form id="add-customer-form" onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Customer Name <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12" 
                placeholder="e.g. Rahul Sharma"
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12" 
                placeholder="e.g. 9876543210"
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12" 
                placeholder="e.g. rahul@example.com"
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
              <input 
                type="text" 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12" 
                placeholder="e.g. 123 Business Street"
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
              <input 
                type="text" 
                value={city} 
                onChange={e => setCity(e.target.value)} 
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12" 
                placeholder="e.g. Mumbai"
              />
            </div>
          </form>
        </div>
        
        <div className="border-t bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSaving} 
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            form="add-customer-form"
            disabled={isSaving} 
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 min-w-[120px]"
          >
            {isSaving ? "Saving..." : "Save Customer"}
          </button>
        </div>
      </div>
    </div>
  )
}
