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
        setLoading(false);
        return;
      }

      sessionStorage.removeItem("aryahs_business_name");
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding request failed:", error);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight">ARYAHS</h1>

          <h2 className="mt-6 text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Set up your business
          </h2>

          <p className="mt-2 text-[15px] text-slate-500">
            Tell us a few details about your business to get started.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
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
                required
              />

              <Input
                label="City"
                placeholder="e.g. Mumbai"
                icon={<MapPin size={18} />}
                value={city}
                onChange={setCity}
                required
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Business Type <span className="text-red-500 ml-0.5">*</span>
                </label>

                <select
                  required
                  className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12 ${
                    businessType === "" ? "text-slate-400" : "text-slate-900"
                  }`}
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                >
                  <option value="" disabled className="text-slate-400">
                    Select business type
                  </option>
                  <option value="Retail" className="text-slate-900">Retail</option>
                  <option value="Wholesale" className="text-slate-900">Wholesale</option>
                  <option value="Manufacturing" className="text-slate-900">Manufacturing</option>
                  <option value="Service" className="text-slate-900">Service</option>
                  <option value="Restaurant" className="text-slate-900">Restaurant</option>
                  <option value="Other" className="text-slate-900">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  GST Registration <span className="text-red-500 ml-0.5">*</span>
                </label>

                <select
                  required
                  className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12 ${
                    gstRegistered === "" ? "text-slate-400" : "text-slate-900"
                  }`}
                  value={gstRegistered}
                  onChange={(e) => setGstRegistered(e.target.value)}
                >
                  <option value="" disabled className="text-slate-400">
                    Select option
                  </option>
                  <option value="GST Registered" className="text-slate-900">GST Registered</option>
                  <option value="Not GST Registered" className="text-slate-900">Not GST Registered</option>
                </select>
              </div>

              {gstRegistered === "GST Registered" && (
                <Input
                  label="GSTIN"
                  placeholder="22AAAAA0000A1Z5"
                  value={gstin}
                  onChange={setGstin}
                  required
                />
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Setting up..." : "Continue to Dashboard"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[13px] text-slate-500">
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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <span 
            className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
              isFocused ? "text-blue-600" : "text-slate-400"
            }`}
          >
            {icon}
          </span>
        )}

        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className={`w-full rounded-lg border border-slate-300 bg-white py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12 ${
            icon ? "px-10" : "px-4"
          }`}
        />
      </div>
    </div>
  );
}
