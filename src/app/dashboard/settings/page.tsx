"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  FileText,
  Globe,
  Lock,
  Save,
  Settings,
  User,
} from "lucide-react";

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [businessType, setBusinessType] = useState("Retail");
  const [gstRegistered, setGstRegistered] = useState("No");
  const [gstin, setGstin] = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [currency, setCurrency] = useState("INR");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();

        if (json.success) {
          if (json.business) {
            setBusinessName(json.business.name || "");
            setPhone(json.business.phone || "");
            setEmail(json.business.email || "");
            setCity(json.business.city || "");
            setGstin(json.business.gstin || "");
            setGstRegistered(json.business.gstin ? "Yes" : "No");
            setCurrency(json.business.currency || "INR");
          }
          if (json.user) {
            setOwnerName(json.user.name || "");
          }
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      

      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* Navigation */}
        <div className="mb-6 flex gap-2 overflow-x-auto rounded-xl border bg-white p-2">
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600">
            <Building2 size={17} />
            Business
          </div>

          <div className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-slate-500">
            <User size={17} />
            Account
          </div>

          <div className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-slate-500">
            <FileText size={17} />
            Invoices
          </div>

          <div className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-slate-500">
            <Lock size={17} />
            Security
          </div>
        </div>

        {/* Business Profile */}
        <section className="rounded-xl border bg-white">
          <div className="border-b p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Building2 size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Business Profile
                </h2>

                <p className="text-sm text-slate-500">
                  Basic information about your business
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <Field
              label="Business Name"
              value={businessName}
              onChange={setBusinessName}
            />

            <Field
              label="Owner Name"
              value={ownerName}
              onChange={setOwnerName}
            />

            <Field label="Phone Number" value={phone} onChange={setPhone} />

            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
            />

            <Field label="City" value={city} onChange={setCity} />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Business Type
              </label>

              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option>Retail</option>
                <option>Wholesale</option>
                <option>Manufacturing</option>
                <option>Service</option>
                <option>Restaurant</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        </section>

        {/* GST */}
        <section className="mt-6 rounded-xl border bg-white">
          <div className="border-b p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                <FileText size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">GST Details</h2>

                <p className="text-sm text-slate-500">
                  Configure your GST registration details
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                GST Registration
              </label>

              <select
                value={gstRegistered}
                onChange={(e) => setGstRegistered(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>

            <Field
              label="GSTIN"
              value={gstin}
              onChange={setGstin}
              placeholder="Enter GSTIN"
              disabled={gstRegistered === "No"}
            />
          </div>
        </section>

        {/* Invoice Settings */}
        <section className="mt-6 rounded-xl border bg-white">
          <div className="border-b p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2 text-green-600">
                <Settings size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Invoice Settings
                </h2>

                <p className="text-sm text-slate-500">
                  Configure your invoice numbering and currency
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <Field
              label="Invoice Prefix"
              value={invoicePrefix}
              onChange={setInvoicePrefix}
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Currency
              </label>

              <div className="relative">
                <Globe
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t bg-slate-50 px-6 py-4">
            <p className="text-sm text-slate-500">
              Example invoice number:
              <span className="ml-1 font-semibold text-slate-700">
                {invoicePrefix}-001
              </span>
            </p>
          </div>
        </section>

        {/* Save */}
        <div className="mt-6 flex items-center justify-end gap-4">
          {saved && (
            <span className="flex items-center gap-2 text-sm font-medium text-green-600">
              <Check size={17} />
              Settings saved
            </span>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Save size={17} />
            Save Changes
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      />
    </div>
  );
}
