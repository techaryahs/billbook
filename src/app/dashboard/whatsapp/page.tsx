"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Receipt,
  Send,
  Smartphone,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";

type Message = {
  id: number;
  customer: string;
  phone: string;
  type: "Invoice" | "Payment Reminder" | "Message";
  reference: string;
  date: string;
  status: "Sent" | "Pending" | "Failed";
};

const initialMessages: Message[] = [
  {
    id: 1,
    customer: "Rahul Sharma",
    phone: "+91 98765 43210",
    type: "Invoice",
    reference: "INV-001",
    date: "26 Sep 2026, 10:30 AM",
    status: "Sent",
  },
  {
    id: 2,
    customer: "Priya Enterprises",
    phone: "+91 98765 12345",
    type: "Payment Reminder",
    reference: "INV-002",
    date: "26 Sep 2026, 11:15 AM",
    status: "Sent",
  },
  {
    id: 3,
    customer: "Amit Traders",
    phone: "+91 99887 77665",
    type: "Invoice",
    reference: "INV-003",
    date: "25 Sep 2026, 04:20 PM",
    status: "Sent",
  },
];

const templates = [
  {
    title: "Invoice Message",
    message:
      "Hello {{customer}}, your invoice {{invoice}} for ₹{{amount}} has been generated. Thank you for your business.",
  },
  {
    title: "Payment Reminder",
    message:
      "Hello {{customer}}, this is a reminder that ₹{{amount}} is pending against invoice {{invoice}}. Please make the payment at your convenience.",
  },
  {
    title: "Thank You",
    message:
      "Thank you {{customer}} for your payment. We appreciate your business.",
  },
];

export default function WhatsAppPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const [customer, setCustomer] = useState("Rahul Sharma");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [reference, setReference] = useState("INV-001");
  const [amount, setAmount] = useState("5900");

  const sendInvoice = () => {
    const newMessage: Message = {
      id: Date.now(),
      customer,
      phone,
      type: "Invoice",
      reference,
      date: new Date().toLocaleString("en-IN"),
      status: "Sent",
    };

    setMessages((current) => [newMessage, ...current]);
    setShowInvoiceModal(false);
  };

  const sendReminder = () => {
    const newMessage: Message = {
      id: Date.now(),
      customer,
      phone,
      type: "Payment Reminder",
      reference,
      date: new Date().toLocaleString("en-IN"),
      status: "Sent",
    };

    setMessages((current) => [newMessage, ...current]);
    setShowReminderModal(false);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Connection Status */}
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-green-200 bg-green-50 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 text-green-600">
              <MessageCircle size={22} />
            </div>

            <div>
              <p className="font-semibold text-green-800">WhatsApp Business</p>

              <p className="text-sm text-green-700">
                Ready to connect with your business account
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-700">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            Connected
          </span>
        </div>

        {/* Actions */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ActionCard
            icon={<Receipt size={22} />}
            title="Send Invoice"
            description="Send an invoice directly to your customer's WhatsApp."
            buttonText="Send Invoice"
            onClick={() => setShowInvoiceModal(true)}
          />

          <ActionCard
            icon={<Send size={22} />}
            title="Payment Reminder"
            description="Send a reminder for an unpaid customer invoice."
            buttonText="Send Reminder"
            onClick={() => setShowReminderModal(true)}
          />
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Messages Sent"
            value={messages.length}
            icon={<Send size={19} />}
          />

          <StatCard title="Customers" value={3} icon={<Users size={19} />} />

          <StatCard
            title="Delivery Rate"
            value="98%"
            icon={<CheckCircle2 size={19} />}
          />
        </div>

        {/* Message History */}
        <div className="mt-6 overflow-hidden rounded-xl border bg-white">
          <div className="border-b px-6 py-5">
            <h2 className="font-semibold text-slate-900">Message History</h2>

            <p className="mt-1 text-sm text-slate-500">
              Recent WhatsApp activity
            </p>
          </div>

          <div className="divide-y">
            {messages.map((message) => (
              <div
                key={message.id}
                className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-50 p-2 text-green-600">
                    <MessageCircle size={19} />
                  </div>

                  <div>
                    <p className="font-medium text-slate-900">
                      {message.customer}
                    </p>

                    <p className="text-xs text-slate-500">{message.phone}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="font-medium text-slate-700">{message.type}</p>

                  <p className="text-xs text-blue-600">{message.reference}</p>
                </div>

                <div className="text-sm text-slate-500">{message.date}</div>

                <StatusBadge status={message.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="mt-6 rounded-xl border bg-white p-6">
          <h2 className="font-semibold text-slate-900">Message Templates</h2>

          <p className="mt-1 text-sm text-slate-500">
            Templates that can later be connected to WhatsApp Business API.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.title}
                className="rounded-xl border border-slate-200 p-4"
              >
                <h3 className="font-medium text-slate-900">{template.title}</h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {template.message}
                </p>

                <button
                  type="button"
                  className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <Modal
          title="Send Invoice on WhatsApp"
          onClose={() => setShowInvoiceModal(false)}
        >
          <div className="space-y-4">
            <Input label="Customer" value={customer} onChange={setCustomer} />

            <Input label="WhatsApp Number" value={phone} onChange={setPhone} />

            <Input
              label="Invoice Number"
              value={reference}
              onChange={setReference}
            />

            <Input label="Invoice Amount" value={amount} onChange={setAmount} />

            <button
              onClick={sendInvoice}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              <MessageCircle size={18} />
              Send on WhatsApp
            </button>
          </div>
        </Modal>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <Modal
          title="Send Payment Reminder"
          onClose={() => setShowReminderModal(false)}
        >
          <div className="space-y-4">
            <Input label="Customer" value={customer} onChange={setCustomer} />

            <Input label="WhatsApp Number" value={phone} onChange={setPhone} />

            <Input
              label="Invoice Number"
              value={reference}
              onChange={setReference}
            />

            <Input
              label="Outstanding Amount"
              value={amount}
              onChange={setAmount}
            />

            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              Hello {customer || "{{customer}}"}, this is a reminder that ₹
              {amount || "{{amount}"} is pending against invoice{" "}
              {reference || "{{invoice}}"}.
            </div>

            <button
              onClick={sendReminder}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              <MessageCircle size={18} />
              Send Reminder
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function ActionCard({
  icon,
  title,
  description,
  buttonText,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-green-50 p-3 text-green-600">{icon}</div>

        <div className="flex-1">
          <h2 className="font-semibold text-slate-900">{title}</h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>

          <button
            onClick={onClick}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            <MessageCircle size={17} />
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>

        <div className="rounded-lg bg-green-50 p-2 text-green-600">{icon}</div>
      </div>

      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Message["status"] }) {
  if (status === "Sent") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-600">
        <CheckCircle2 size={13} />
        Sent
      </span>
    );
  }

  if (status === "Pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600">
        <Clock3 size={13} />
        Pending
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
      <XCircle size={13} />
      Failed
    </span>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>

          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}
