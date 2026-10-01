"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Package, Save, Trash2 } from "lucide-react";

type InvoiceItem = {
  productName: string;
  hsnSac: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  discount?: number | null;
  gstRate: number;
  taxableAmount?: number | null;
  amount: number;
};

type ExtractedInvoice = {
  supplierName: string | null;
  supplierGstin: string | null;
  supplierAddress?: string | null;

  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  placeOfSupply?: string | null;

  customerName?: string | null;
  customerGstin?: string | null;
  customerAddress?: string | null;

  items: InvoiceItem[];

  subtotal?: number | null;
  discount?: number | null;
  taxableAmount?: number | null;
  cgst?: number | null;
  sgst?: number | null;
  igst?: number | null;
  totalTax?: number | null;
  total?: number | null;
};

export default function CreatePurchasePage() {
  const router = useRouter();

  const [invoice, setInvoice] = useState<ExtractedInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("aryahs_review_purchase");

      if (!stored) {
        router.replace("/dashboard/purchases/scan");
        return;
      }

      const parsed = JSON.parse(stored) as ExtractedInvoice;

      setInvoice({
        ...parsed,
        items: Array.isArray(parsed.items) ? parsed.items : [],
      });
    } catch (error) {
      console.error("Unable to load purchase review:", error);
      router.replace("/dashboard/purchases/scan");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const updateInvoice = (
    field: keyof ExtractedInvoice,
    value: string | number | null,
  ) => {
    setInvoice((previous) =>
      previous
        ? {
            ...previous,
            [field]: value,
          }
        : previous,
    );
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number | null,
  ) => {
    setInvoice((previous) => {
      if (!previous) return previous;

      const items = [...previous.items];

      const current = items[index];

      if (!current) return previous;

      const updated: InvoiceItem = {
        ...current,
        [field]: value,
      };

      if (field === "quantity" || field === "unitPrice") {
        const quantity =
          field === "quantity" ? Number(value) : Number(current.quantity);

        const unitPrice =
          field === "unitPrice" ? Number(value) : Number(current.unitPrice);

        updated.amount = quantity * unitPrice;
        updated.taxableAmount = updated.amount;
      }

      items[index] = updated;

      return {
        ...previous,
        items,
      };
    });
  };

  const removeItem = (index: number) => {
    setInvoice((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        items: previous.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const calculatedSubtotal = useMemo(() => {
    if (!invoice) return 0;

    return invoice.items.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
  }, [invoice]);

  const discount = Number(invoice?.discount || 0);

  const calculatedTaxable = Math.max(calculatedSubtotal - discount, 0);

  const cgst = Number(invoice?.cgst || 0);
  const sgst = Number(invoice?.sgst || 0);
  const igst = Number(invoice?.igst || 0);

  const calculatedTotal = calculatedTaxable + cgst + sgst + igst;

  const handleCreatePurchase = async () => {
    if (!invoice || creating) return;

    if (!invoice.supplierName?.trim()) {
      alert("Supplier name is required.");
      return;
    }

    if (!invoice.invoiceNumber?.trim()) {
      alert("Invoice number is required.");
      return;
    }

    if (invoice.items.length === 0) {
      alert("At least one purchase item is required.");
      return;
    }

    for (const item of invoice.items) {
      if (!item.productName?.trim()) {
        alert("Every purchase item must have a product name.");
        return;
      }

      if (
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        alert(`Invalid quantity for ${item.productName}.`);
        return;
      }

      if (
        !Number.isFinite(Number(item.unitPrice)) ||
        Number(item.unitPrice) < 0
      ) {
        alert(`Invalid rate for ${item.productName}.`);
        return;
      }
    }

    try {
      setCreating(true);

      const payload = {
        supplierName: invoice.supplierName.trim(),
        supplierGstin: invoice.supplierGstin?.trim() || null,

        purchaseNumber: invoice.invoiceNumber.trim(),

        purchaseDate: invoice.invoiceDate || null,
        dueDate: invoice.dueDate || null,

        subtotal: calculatedSubtotal,
        discount,
        taxableAmount: calculatedTaxable,

        cgst,
        sgst,
        igst,

        total: calculatedTotal,

        items: invoice.items.map((item) => ({
          productName: item.productName.trim(),

          sku: null,

          hsnSac: item.hsnSac?.trim() || null,

          unit: item.unit?.trim() || "PCS",

          quantity: Number(item.quantity),

          unitPrice: Number(item.unitPrice),

          discount: Number(item.discount || 0),

          gstRate: Number(item.gstRate || 0),

          taxableAmount: Number(item.taxableAmount ?? item.amount ?? 0),

          cgst: 0,
          sgst: 0,
          igst: 0,

          total: Number(item.amount || 0),
        })),
      };

      const response = await fetch("/api/purchases/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.details || result.message || "Unable to create purchase.",
        );
      }

      /*
       * Purchase successfully saved.
       */
      sessionStorage.removeItem("aryahs_review_purchase");

      alert(`Purchase ${result.data.purchaseNumber} created successfully.`);

      router.push("/dashboard/purchases");
    } catch (error) {
      console.error("Create purchase error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to create purchase. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-2xl border bg-white p-8">
            <p className="text-sm text-slate-500">Loading purchase review...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/dashboard/purchases/scan")}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Back to Invoice Scanner
            </button>

            <h1 className="text-2xl font-bold text-slate-900">
              Review Purchase
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review and correct the extracted invoice information before
              creating the purchase.
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 sm:flex">
            <CheckCircle2 size={17} />
            OCR Extraction Complete
          </div>
        </div>

        {/* Supplier + Invoice Information */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Supplier & Invoice Details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Verify the supplier and invoice information.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Supplier Name"
              value={invoice.supplierName || ""}
              onChange={(value) => updateInvoice("supplierName", value)}
            />

            <Input
              label="Supplier GSTIN"
              value={invoice.supplierGstin || ""}
              onChange={(value) => updateInvoice("supplierGstin", value)}
            />

            <Input
              label="Invoice Number"
              value={invoice.invoiceNumber || ""}
              onChange={(value) => updateInvoice("invoiceNumber", value)}
            />

            <Input
              label="Invoice Date"
              value={invoice.invoiceDate || ""}
              onChange={(value) => updateInvoice("invoiceDate", value)}
            />

            <Input
              label="Due Date"
              value={invoice.dueDate || ""}
              onChange={(value) => updateInvoice("dueDate", value)}
            />

            <Input
              label="Place of Supply"
              value={invoice.placeOfSupply || ""}
              onChange={(value) => updateInvoice("placeOfSupply", value)}
            />
          </div>

          {invoice.supplierAddress && (
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Supplier Address
              </label>

              <textarea
                value={invoice.supplierAddress}
                onChange={(e) =>
                  updateInvoice("supplierAddress", e.target.value)
                }
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}
        </section>

        {/* Customer */}
        {(invoice.customerName || invoice.customerGstin) && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Customer / Bill To
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review the customer information detected on the invoice.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Customer Name"
                value={invoice.customerName || ""}
                onChange={(value) => updateInvoice("customerName", value)}
              />

              <Input
                label="Customer GSTIN"
                value={invoice.customerGstin || ""}
                onChange={(value) => updateInvoice("customerGstin", value)}
              />
            </div>
          </section>
        )}

        {/* Items */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Purchase Items
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Verify quantities, prices and GST before creating the purchase.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
              <Package size={17} />
              {invoice.items.length} items
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-4 py-4">HSN/SAC</th>
                  <th className="px-4 py-4">Qty</th>
                  <th className="px-4 py-4">Rate</th>
                  <th className="px-4 py-4">GST %</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>

              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="px-6 py-4">
                      <input
                        value={item.productName}
                        onChange={(e) =>
                          updateItem(index, "productName", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <input
                        value={item.hsnSac || ""}
                        onChange={(e) =>
                          updateItem(index, "hsnSac", e.target.value)
                        }
                        className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", Number(e.target.value))
                        }
                        className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(index, "unitPrice", Number(e.target.value))
                        }
                        className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="0"
                        value={item.gstRate}
                        onChange={(e) =>
                          updateItem(index, "gstRate", Number(e.target.value))
                        }
                        className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    <td className="px-4 py-4 font-semibold text-slate-900">
                      ₹
                      {Number(item.amount || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={invoice.items.length === 1}
                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                        title="Remove item"
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Summary */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            Purchase Summary
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard label="Subtotal" value={calculatedSubtotal} />

            <SummaryCard label="Discount" value={discount} />

            <SummaryCard label="Taxable Amount" value={calculatedTaxable} />

            <SummaryCard label="CGST" value={cgst} />

            <SummaryCard label="SGST" value={sgst} />
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-blue-50 px-5 py-5">
            <span className="font-semibold text-slate-700">Grand Total</span>

            <span className="text-2xl font-bold text-blue-600">
              ₹
              {calculatedTotal.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/dashboard/purchases/scan")}
            className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back
          </button>

          <button
            type="button"
            onClick={handleCreatePurchase}
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />

            {creating ? "Creating Purchase..." : "Create Purchase"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-2 text-lg font-bold text-slate-900">
        ₹
        {value.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}
      </p>
    </div>
  );
}
