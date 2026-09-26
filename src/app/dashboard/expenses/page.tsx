"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Plus,
  Receipt,
  Search,
  X,
} from "lucide-react";

type Expense = {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  notes: string;
};

const initialExpenses: Expense[] = [
  {
    id: 1,
    title: "Office Rent",
    category: "Rent",
    amount: 25000,
    date: "26 Sep 2026",
    paymentMethod: "Bank Transfer",
    notes: "Monthly office rent",
  },
  {
    id: 2,
    title: "Electricity Bill",
    category: "Utilities",
    amount: 4200,
    date: "24 Sep 2026",
    paymentMethod: "UPI",
    notes: "September electricity",
  },
  {
    id: 3,
    title: "Internet",
    category: "Utilities",
    amount: 1500,
    date: "22 Sep 2026",
    paymentMethod: "UPI",
    notes: "Business internet",
  },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");

  const filteredExpenses = expenses.filter((expense) => {
    const value = search.toLowerCase();

    return (
      expense.title.toLowerCase().includes(value) ||
      expense.category.toLowerCase().includes(value) ||
      expense.paymentMethod.toLowerCase().includes(value)
    );
  });

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !category || !amount) return;

    const newExpense: Expense = {
      id: Date.now(),
      title,
      category,
      amount: Number(amount),
      date: date
        ? new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
      paymentMethod: paymentMethod || "Cash",
      notes,
    };

    setExpenses((previous) => [newExpense, ...previous]);

    setTitle("");
    setCategory("");
    setAmount("");
    setDate("");
    setPaymentMethod("");
    setNotes("");
    setShowForm(false);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Expense
          </button>
        </div>
        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Expenses"
            value={`₹${totalExpenses.toLocaleString("en-IN")}`}
          />

          <StatCard
            title="Expense Entries"
            value={expenses.length.toString()}
          />

          <StatCard
            title="Average Expense"
            value={`₹${
              expenses.length
                ? Math.round(totalExpenses / expenses.length).toLocaleString(
                    "en-IN",
                  )
                : "0"
            }`}
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
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Expense List */}
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="hidden grid-cols-6 border-b bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Expense</span>
            <span>Category</span>
            <span>Date</span>
            <span>Payment</span>
            <span>Amount</span>
            <span>Notes</span>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Receipt size={40} className="mx-auto text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No expenses found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add your first business expense.
              </p>
            </div>
          ) : (
            filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="grid gap-3 border-b px-6 py-4 last:border-b-0 md:grid-cols-6 md:items-center"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {expense.title}
                  </p>
                </div>

                <div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                    {expense.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays size={15} />
                  {expense.date}
                </div>

                <div className="text-sm text-slate-600">
                  {expense.paymentMethod}
                </div>

                <div className="font-semibold text-red-600">
                  ₹{expense.amount.toLocaleString("en-IN")}
                </div>

                <div className="text-sm text-slate-500">
                  {expense.notes || "—"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add Expense
                </h2>

                <p className="text-sm text-slate-500">
                  Record a business expense
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-5 p-6">
              <FormInput
                label="Expense Title"
                placeholder="Office rent"
                value={title}
                onChange={setTitle}
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Category
                  </label>

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select category</option>
                    <option>Rent</option>
                    <option>Utilities</option>
                    <option>Salary</option>
                    <option>Transport</option>
                    <option>Marketing</option>
                    <option>Office Supplies</option>
                    <option>Maintenance</option>
                    <option>Travel</option>
                    <option>Other</option>
                  </select>
                </div>

                <FormInput
                  label="Amount"
                  placeholder="0"
                  type="number"
                  value={amount}
                  onChange={setAmount}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Date
                  </label>

                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Payment Method
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select method</option>
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Card</option>
                    <option>Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Notes
                </label>

                <textarea
                  placeholder="Optional notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Save Expense
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

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}
