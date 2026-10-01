"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileImage,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

type ExtractedItem = {
  productName: string;
  hsnSac: string | null;
  quantity: number | null;
  unitPrice: number | null;
  gstRate: number | null;
  amount: number | null;
};

type ExtractedInvoice = {
  supplierName: string | null;
  supplierGstin: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  customerName: string | null;
  customerGstin: string | null;
  taxableAmount: number | null;
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
  discount: number | null;
  total: number | null;
  items: ExtractedItem[];
  rawText?: string;
  pages?: number;
};

export default function InvoiceScannerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [scanning, setScanning] = useState(false);
  const [extractedInvoice, setExtractedInvoice] =
    useState<ExtractedInvoice | null>(null);

  const handleFile = (selectedFile: File) => {
    setError("");
    setSuccess("");
    setExtractedInvoice(null);

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setError("Please upload a PDF, JPG, PNG, or WebP invoice.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size must be less than 10 MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);
  };

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(null);
    setPreviewUrl(null);
    setError("");
    setSuccess("");
    setExtractedInvoice(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startScanning = async () => {
    if (!file) {
      setError("Please upload an invoice first.");
      return;
    }

    setError("");
    setSuccess("");
    setExtractedInvoice(null);
    setScanning(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai/invoice", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to process the invoice.");
      }

      setExtractedInvoice(result.data);

      setSuccess(
        "Invoice scanned successfully. Please review the extracted information before creating the purchase.",
      );
    } catch (scanError) {
      console.error("Invoice scan failed:", scanError);

      setError(
        scanError instanceof Error
          ? scanError.message
          : "Unable to process the invoice.",
      );
    } finally {
      setScanning(false);
    }
  };

  const scanAnotherInvoice = () => {
    removeFile();

    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/dashboard/purchases"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to Purchases
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Sparkles size={24} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  AI Invoice Scanner
                </h1>

                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                  SMART EXTRACTION
                </span>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Your invoice is processed locally and the relevant billing
                information is extracted automatically using OCR.
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="font-semibold text-slate-900">
              Upload Supplier Invoice
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Upload a clear invoice image or PDF for automatic extraction.
            </p>
          </div>

          <div className="p-6">
            {!file ? (
              <>
                {/* Upload Area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-14 text-center transition ${
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <Upload size={28} />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-slate-900">
                    Drop your invoice here
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    or click to choose a file from your computer
                  </p>

                  <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                    <Upload size={17} />
                    Choose Invoice
                  </div>

                  <p className="mt-5 text-xs text-slate-400">
                    PDF, JPG, PNG or WebP · Maximum 10 MB
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </div>

                {/* What will be extracted */}
                <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    What Aryahs will extract
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <ExtractionItem label="Supplier details" />
                    <ExtractionItem label="Invoice number" />
                    <ExtractionItem label="Invoice date" />
                    <ExtractionItem label="Products & quantities" />
                    <ExtractionItem label="Purchase prices" />
                    <ExtractionItem label="GST & total" />
                  </div>
                </div>
              </>
            ) : (
              <div>
                {/* Selected File */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-5 sm:flex-row">
                    {/* Preview */}
                    <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white sm:w-40">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Invoice preview"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <FileText
                            size={42}
                            className="mx-auto text-red-500"
                          />

                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            PDF
                          </p>
                        </div>
                      )}
                    </div>

                    {/* File Information */}
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {file.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={removeFile}
                          disabled={scanning}
                          className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Remove invoice"
                        >
                          <X size={19} />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-green-600">
                        <CheckCircle2 size={17} />
                        Invoice ready for scanning
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Info */}
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <InfoCard
                    icon={<FileText size={19} />}
                    title="File type"
                    value={getFileType(file)}
                  />

                  <InfoCard
                    icon={<FileImage size={19} />}
                    title="File size"
                    value={formatFileSize(file.size)}
                  />

                  <InfoCard
                    icon={<CheckCircle2 size={19} />}
                    title="Status"
                    value={scanning ? "Scanning..." : "Ready"}
                  />
                </div>

                {/* Scan Actions */}
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={removeFile}
                    disabled={scanning}
                    className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Choose Another
                  </button>

                  <button
                    type="button"
                    onClick={startScanning}
                    disabled={scanning}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    {scanning ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Scanning Invoice...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Start AI Scan
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </div>
        </div>

        {/* Extracted Result */}
        {extractedInvoice && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Extracted Invoice
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Review the extracted information before creating the
                    purchase.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                  <CheckCircle2 size={15} />
                  Extraction Complete
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Invoice Details */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Invoice Details
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <ResultField
                    label="Supplier"
                    value={extractedInvoice.supplierName}
                  />

                  <ResultField
                    label="Supplier GSTIN"
                    value={extractedInvoice.supplierGstin}
                  />

                  <ResultField
                    label="Invoice Number"
                    value={extractedInvoice.invoiceNumber}
                  />

                  <ResultField
                    label="Invoice Date"
                    value={extractedInvoice.invoiceDate}
                  />

                  <ResultField
                    label="Due Date"
                    value={extractedInvoice.dueDate}
                  />

                  <ResultField
                    label="Customer"
                    value={extractedInvoice.customerName}
                  />

                  <ResultField
                    label="Customer GSTIN"
                    value={extractedInvoice.customerGstin}
                  />

                  <ResultField
                    label="Pages"
                    value={
                      extractedInvoice.pages
                        ? String(extractedInvoice.pages)
                        : null
                    }
                  />
                </div>
              </div>

              {/* Items */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Invoice Items
                  </h3>

                  <span className="text-xs text-slate-500">
                    {extractedInvoice.items.length} item
                    {extractedInvoice.items.length === 1 ? "" : "s"}
                  </span>
                </div>

                {extractedInvoice.items.length > 0 ? (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[800px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">HSN/SAC</th>
                          <th className="px-4 py-3">Qty</th>
                          <th className="px-4 py-3">Unit Price</th>
                          <th className="px-4 py-3">GST</th>
                          <th className="px-4 py-3">Amount</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {extractedInvoice.items.map((item, index) => (
                          <tr key={`${item.productName}-${index}`}>
                            <td className="px-4 py-4 font-medium text-slate-900">
                              {item.productName || "—"}
                            </td>

                            <td className="px-4 py-4 text-slate-600">
                              {item.hsnSac || "—"}
                            </td>

                            <td className="px-4 py-4 text-slate-600">
                              {formatNumber(item.quantity)}
                            </td>

                            <td className="px-4 py-4 text-slate-600">
                              {formatCurrency(item.unitPrice)}
                            </td>

                            <td className="px-4 py-4 text-slate-600">
                              {item.gstRate !== null ? `${item.gstRate}%` : "—"}
                            </td>

                            <td className="px-4 py-4 font-semibold text-slate-900">
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                    No line items could be automatically extracted from this
                    invoice. Please review the source invoice manually.
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-slate-900">
                  Invoice Summary
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <SummaryCard
                    label="Taxable Amount"
                    value={formatCurrency(extractedInvoice.taxableAmount)}
                  />

                  <SummaryCard
                    label="Discount"
                    value={formatCurrency(extractedInvoice.discount)}
                  />

                  <SummaryCard
                    label="CGST"
                    value={formatCurrency(extractedInvoice.cgst)}
                  />

                  <SummaryCard
                    label="SGST"
                    value={formatCurrency(extractedInvoice.sgst)}
                  />

                  <SummaryCard
                    label="IGST"
                    value={formatCurrency(extractedInvoice.igst)}
                  />
                </div>

                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-blue-900">
                      Invoice Total
                    </span>

                    <span className="text-xl font-bold text-blue-700">
                      {formatCurrency(extractedInvoice.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Action */}
              <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={scanAnotherInvoice}
                  className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Scan Another Invoice
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!extractedInvoice) return;

                    sessionStorage.setItem(
                      "aryahs_review_purchase",
                      JSON.stringify(extractedInvoice),
                    );

                    window.location.href = "/dashboard/purchases/create";
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <CheckCircle2 size={18} />
                  Review & Create Purchase
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Process */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            How Invoice Scanner works
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-4">
            <ProcessStep
              number="01"
              title="Upload"
              description="Upload your supplier invoice as a PDF or image."
            />

            <ProcessStep
              number="02"
              title="Extract"
              description="Aryahs locally reads the document using OCR to extract details."
            />

            <ProcessStep
              number="03"
              title="Review"
              description="Review and correct the extracted information before saving."
            />

            <ProcessStep
              number="04"
              title="Create Purchase"
              description="Confirm the purchase and update your business records."
            />
          </div>
        </div>

        {/* Important Notice */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-900">
            Always review extracted information
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-700">
            Invoice extraction can occasionally make mistakes. Aryahs will show
            the extracted information for review before anything is added to
            your purchases, inventory or ledger.
          </p>
        </div>
      </div>
    </main>
  );
}

function ExtractionItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <CheckCircle2 size={16} className="shrink-0 text-blue-600" />
      {label}
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-xs font-medium">{title}</span>
      </div>

      <p className="mt-2 truncate text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ResultField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value || "Not detected"}
      </p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-2 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ProcessStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
        {number}
      </div>

      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileType(file: File) {
  if (file.type === "application/pdf") {
    return "PDF";
  }

  if (file.type === "image/jpeg") {
    return "JPEG Image";
  }

  if (file.type === "image/png") {
    return "PNG Image";
  }

  if (file.type === "image/webp") {
    return "WebP Image";
  }

  return "Invoice File";
}

function formatCurrency(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
}
