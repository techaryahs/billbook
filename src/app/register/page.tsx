"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, LockKeyhole, Mail, User } from "lucide-react";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to create account");
        return;
      }

      // Keep the business name for the onboarding step.
      sessionStorage.setItem("aryahs_business_name", businessName);

      router.push("/onboarding");
    } catch (error) {
      console.error("Registration request failed:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-blue-600">
            ARYAHS
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Start managing your business
          </p>
        </div>

        {/* Register Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Create your account
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Set up your business on Aryahs
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleRegister}>
            {/* Name */}
            <Input
              id="name"
              label="Your Name"
              placeholder="Enter your name"
              icon={<User size={18} />}
              value={name}
              onChange={setName}
              required
            />

            {/* Business */}
            <Input
              id="businessName"
              label="Business Name"
              placeholder="Enter business name"
              icon={<Building2 size={18} />}
              value={businessName}
              onChange={setBusinessName}
              required
            />

            {/* Email */}
            <Input
              id="email"
              label="Email"
              placeholder="you@example.com"
              type="email"
              icon={<Mail size={18} />}
              value={email}
              onChange={setEmail}
              required
            />

            {/* Password */}
            <Input
              id="password"
              label="Password"
              placeholder="Create a password"
              type="password"
              icon={<LockKeyhole size={18} />}
              value={password}
              onChange={setPassword}
              required
            />

            {/* Create Account */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          {/* Login */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          By creating an account, you agree to Aryahs&apos; terms and
          conditions.
        </p>
      </div>
    </main>
  );
}

function Input({
  id,
  label,
  placeholder,
  type = "text",
  icon,
  value,
  onChange,
  required = false,
}: {
  id: string;
  label: string;
  placeholder: string;
  type?: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}

        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`w-full rounded-lg border border-slate-200 bg-white py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            icon ? "px-10" : "px-4"
          }`}
        />
      </div>
    </div>
  );
}
