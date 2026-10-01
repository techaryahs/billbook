"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type AssistantResponse = {
  success: boolean;
  data?: {
    answer?: string;
    intent?: string;
    data?: unknown;
  };
  message?: string;
  details?: string;
};

const suggestions = [
  "How much did I sell this month?",
  "Who owes me the most money?",
  "What are my top selling products?",
  "Show me my expenses this month",
  "Give me a business summary",
];

export default function BusinessAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI Business Assistant. Ask me about your sales, purchases, expenses, customers, inventory or payments.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function askAssistant(question?: string) {
    const message = (question ?? input).trim();

    if (!message || loading) return;

    // Add user message immediately
    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: message,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      // Business ID is NOT required here.
      // The API gets it from the authenticated session.
      const response = await fetch("/api/ai/business-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message,
        }),
      });

      const result: AssistantResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.details ||
            result.message ||
            "Unable to get assistant response.",
        );
      }

      const answer =
        result.data?.answer ||
        "I couldn't generate an answer for that question.";

      // Add assistant response
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (error) {
      console.error("Assistant frontend error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong while processing your question.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    askAssistant();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            AI Business Assistant
          </h1>

          <p className="mt-2 text-slate-500">
            Ask questions about your business data.
          </p>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => askAssistant(suggestion)}
              disabled={loading}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Chat */}
        <div className="min-h-[500px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="space-y-5">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                  Analyzing your business data...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about your business..."
            disabled={loading}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Ask"}
          </button>
        </form>
      </div>
    </div>
  );
}
