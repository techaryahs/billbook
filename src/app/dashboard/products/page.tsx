"use client";

import { useState } from "react";
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
  id: number;
  name: string;
  sku: string;
  category: string;
  sellingPrice: number;
  purchasePrice: number;
  stock: number;
};

const initialProducts: Product[] = [
  {
    id: 1,
    name: "ABC Product",
    sku: "ABC001",
    category: "General",
    sellingPrice: 500,
    purchasePrice: 350,
    stock: 25,
  },
  {
    id: 2,
    name: "Premium Product",
    sku: "PREM001",
    category: "Premium",
    sellingPrice: 1200,
    purchasePrice: 850,
    stock: 12,
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [stock, setStock] = useState("");

  const filteredProducts = products.filter((product) => {
    const value = search.toLowerCase();

    return (
      product.name.toLowerCase().includes(value) ||
      product.sku.toLowerCase().includes(value) ||
      product.category.toLowerCase().includes(value)
    );
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !sellingPrice) return;

    const newProduct: Product = {
      id: Date.now(),
      name,
      sku,
      category,
      sellingPrice: Number(sellingPrice),
      purchasePrice: Number(purchasePrice) || 0,
      stock: Number(stock) || 0,
    };

    setProducts((previous) => [newProduct, ...previous]);

    setName("");
    setSku("");
    setCategory("");
    setSellingPrice("");
    setPurchasePrice("");
    setStock("");
    setShowForm(false);
  };

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);

  const stockValue = products.reduce(
    (sum, product) => sum + product.purchasePrice * product.stock,
    0,
  );

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
            Add Product
          </button>
        </div>
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard title="Total Products" value={products.length.toString()} />

          <StatCard
            title="Total Stock"
            value={totalStock.toLocaleString("en-IN")}
          />

          <StatCard
            title="Stock Value"
            value={`₹${stockValue.toLocaleString("en-IN")}`}
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

          {filteredProducts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Package size={40} className="mx-auto text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No products found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add your first product to start managing inventory.
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
                  ₹{product.purchasePrice.toLocaleString("en-IN")}
                </div>

                <div className="font-semibold text-slate-900">
                  ₹{product.sellingPrice.toLocaleString("en-IN")}
                </div>

                <div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      product.stock === 0
                        ? "bg-red-50 text-red-600"
                        : product.stock <= 5
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-green-50 text-green-600"
                    }`}
                  >
                    {product.stock} units
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
                  className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Add Product
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
