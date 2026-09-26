"use client";

import { ArrowRight, Building2, MapPin, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [gstRegistered, setGstRegistered] = useState("");
  const [gstin, setGstin] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedName = sessionStorage.getItem("aryahs_business_name");
    if (savedName) {
      setName(savedName);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/business/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          city,
          gstin: gstRegistered === "GST Registered" ? gstin : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to set up business");
        return;
      }

      sessionStorage.removeItem("aryahs_business_name");
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding request failed:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">ARYAHS</h1>

          <h2 className="mt-6 text-2xl font-bold text-slate-900">
            Set up your business
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Tell us a few details about your business to get started.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Business Name"
                placeholder="e.g. ABC Traders"
                icon={<Building2 size={18} />}
                value={name}
                onChange={setName}
                required
              />

              <Input
                label="Phone Number"
                placeholder="e.g. 9876543210"
                icon={<Phone size={18} />}
                value={phone}
                onChange={setPhone}
              />

              <Input
                label="City"
                placeholder="e.g. Mumbai"
                icon={<MapPin size={18} />}
                value={city}
                onChange={setCity}
              />

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Business Type
                </label>

                <select
                  className="w-full rounded-lg border bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                >
                  <option value="">Select business type</option>
                  <option>Retail</option>
                  <option>Wholesale</option>
                  <option>Manufacturing</option>
                  <option>Service</option>
                  <option>Restaurant</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  GST Registration
                </label>

                <select
                  className="w-full rounded-lg border bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={gstRegistered}
                  onChange={(e) => setGstRegistered(e.target.value)}
                >
                  <option value="">Select option</option>
                  <option>GST Registered</option>
                  <option>Not GST Registered</option>
                </select>
              </div>

              {gstRegistered === "GST Registered" && (
                <Input
                  label="GSTIN"
                  placeholder="22AAAAA0000A1Z5"
                  value={gstin}
                  onChange={setGstin}
                />
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Setting up..." : "Continue to Dashboard"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          You can update these details later from Settings.
        </p>
      </div>
    </main>
  );
}

function Input({
  label,
  placeholder,
  icon,
  value,
  onChange,
  required = false,
}: {
  label: string;
  placeholder: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}

        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`w-full rounded-lg border py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            icon ? "px-10" : "px-4"
          }`}
        />
      </div>
    </div>
  );
}
