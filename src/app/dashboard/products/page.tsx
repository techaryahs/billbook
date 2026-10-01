"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Barcode,
  Boxes,
  Package,
  Plus,
  Search,
  X,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null; // Using description as category/type
  sellingPrice: number;
  purchasePrice: number;
  stockQuantity: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [stock, setStock] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch products");
      }
      setProducts(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const value = search.toLowerCase();

    return (
      product.name.toLowerCase().includes(value) ||
      (product.sku && product.sku.toLowerCase().includes(value)) ||
      (product.category && product.category.toLowerCase().includes(value))
    );
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sellingPrice) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku,
          description: category,
          sellingPrice: Number(sellingPrice),
          purchasePrice: Number(purchasePrice) || 0,
          stockQuantity: Number(stock) || 0,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add product");
      }

      await fetchProducts();

      setName("");
      setSku("");
      setCategory("");
      setSellingPrice("");
      setPurchasePrice("");
      setStock("");
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalStock = products.reduce((sum, product) => sum + Number(product.stockQuantity || 0), 0);

  const stockValue = products.reduce(
    (sum, product) => sum + (Number(product.purchasePrice) || 0) * Number(product.stockQuantity || 0),
    0,
  );

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
            Add Product
          </button>
        </div>
        
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard title="Total Products" value={isLoading ? "..." : products.length.toString()} />

          <StatCard
            title="Total Stock"
            value={isLoading ? "..." : totalStock.toLocaleString("en-IN")}
          />

          <StatCard
            title="Stock Value"
            value={isLoading ? "..." : `₹${stockValue.toLocaleString("en-IN")}`}
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
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="hidden grid-cols-6 border-b bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Product</span>
            <span>SKU</span>
            <span>Category</span>
            <span>Purchase</span>
            <span>Selling</span>
            <span>Stock</span>
          </div>

          {isLoading ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm text-slate-500">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Package size={40} className="mx-auto text-slate-300" />
              <h3 className="mt-4 font-semibold text-slate-900">
                {search ? "No matches found" : "No products found"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Try a different search term"
                  : "Add your first product to start managing inventory."}
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="grid gap-3 border-b px-6 py-4 last:border-b-0 md:grid-cols-6 md:items-center"
              >
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Barcode size={15} />
                  {product.sku || "—"}
                </div>

                <div className="text-sm text-slate-600">
                  {product.category || "General"}
                </div>

                <div className="text-sm text-slate-600">
                  ₹{Number(product.purchasePrice).toLocaleString("en-IN")}
                </div>

                <div className="font-semibold text-slate-900">
                  ₹{Number(product.sellingPrice).toLocaleString("en-IN")}
                </div>

                <div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      Number(product.stockQuantity) <= 0
                        ? "bg-red-50 text-red-600"
                        : Number(product.stockQuantity) <= 5
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-green-50 text-green-600"
                    }`}
                  >
                    {Number(product.stockQuantity)} units
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add Product
                </h2>

                <p className="text-sm text-slate-500">Create a new product</p>
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
            <form onSubmit={handleAddProduct} className="space-y-5 p-6">
              <FormInput
                label="Product Name"
                placeholder="Enter product name"
                value={name}
                onChange={setName}
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="SKU / Barcode"
                  placeholder="ABC001"
                  value={sku}
                  onChange={setSku}
                />

                <FormInput
                  label="Category"
                  placeholder="General"
                  value={category}
                  onChange={setCategory}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Purchase Price"
                  placeholder="0"
                  type="number"
                  value={purchasePrice}
                  onChange={setPurchasePrice}
                />

                <FormInput
                  label="Selling Price"
                  placeholder="0"
                  type="number"
                  value={sellingPrice}
                  onChange={setSellingPrice}
                  required
                />
              </div>

              <FormInput
                label="Opening Stock"
                placeholder="0"
                type="number"
                value={stock}
                onChange={setStock}
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
                  {isSubmitting ? "Adding..." : "Add Product"}
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
