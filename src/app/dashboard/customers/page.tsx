"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  outstanding: number;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customers");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch customers");
      }
      setCustomers(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const value = search.toLowerCase();
    return (
      customer.name.toLowerCase().includes(value) ||
      (customer.phone && customer.phone.includes(value)) ||
      (customer.email && customer.email.toLowerCase().includes(value))
    );
  });

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, city }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add customer");
      }

      await fetchCustomers();

      setName("");
      setPhone("");
      setEmail("");
      setCity("");
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Customer
          </button>
        </div>
        
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Customers"
            value={isLoading ? "..." : customers.length.toString()}
          />

          <StatCard
            title="Total Outstanding"
            value={
              isLoading
                ? "..."
                : `₹${customers
                    .reduce((sum, customer) => sum + (customer.outstanding || 0), 0)
                    .toLocaleString("en-IN")}`
            }
          />

          <StatCard
            title="Active Customers"
            value={isLoading ? "..." : customers.length.toString()}
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
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="hidden grid-cols-5 border-b bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Customer</span>
            <span>Phone</span>
            <span>City</span>
            <span>Outstanding</span>
            <span className="text-right">Action</span>
          </div>

          {isLoading ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm text-slate-500">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <UserRound size={40} className="mx-auto text-slate-300" />
              <h3 className="mt-4 font-semibold text-slate-900">
                {search ? "No matches found" : "No customers found"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Try a different search term"
                  : "Add a customer to start managing your customer records."}
              </p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="grid gap-3 border-b px-6 py-4 last:border-b-0 md:grid-cols-5 md:items-center"
              >
                {/* Customer */}
                <div>
                  <p className="font-semibold text-slate-900">
                    {customer.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {customer.email || "No email"}
                  </p>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={15} />
                  {customer.phone || "—"}
                </div>

                {/* City */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={15} />
                  {customer.city || "—"}
                </div>

                {/* Outstanding */}
                <div>
                  <p
                    className={`font-semibold ${
                      (customer.outstanding || 0) > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    ₹{(customer.outstanding || 0).toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Action */}
                <div className="text-left md:text-right">
                  <button className="text-sm font-medium text-blue-600 hover:underline">
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add Customer
                </h2>

                <p className="text-sm text-slate-500">
                  Create a new customer record
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddCustomer} className="space-y-5 p-6">
              <FormInput
                label="Customer Name"
                placeholder="Enter customer name"
                value={name}
                onChange={setName}
                required
              />

              <FormInput
                label="Phone Number"
                placeholder="9876543210"
                value={phone}
                onChange={setPhone}
              />

              <FormInput
                label="Email"
                placeholder="customer@example.com"
                value={email}
                onChange={setEmail}
                type="email"
              />

              <FormInput
                label="City"
                placeholder="Mumbai"
                value={city}
                onChange={setCity}
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
                  {isSubmitting ? "Adding..." : "Add Customer"}
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
  type = "text",
  required = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        {type === "email" && (
          <Mail
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border border-slate-200 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            type === "email" ? "pl-10 pr-4" : "px-4"
          }`}
        />
      </div>
    </div>
  );
}
