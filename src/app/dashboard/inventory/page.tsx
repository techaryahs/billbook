"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Boxes,
  Package,
  Search,
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  minimumStock: number;
};

type Movement = {
  id: number;
  product: string;
  type: "IN" | "OUT";
  quantity: number;
  date: string;
  reference: string;
};

const products: Product[] = [
  {
    id: 1,
    name: "ABC Product",
    sku: "ABC001",
    category: "General",
    stock: 25,
    purchasePrice: 350,
    sellingPrice: 500,
    minimumStock: 10,
  },
  {
    id: 2,
    name: "Premium Product",
    sku: "PREM001",
    category: "Premium",
    stock: 12,
    purchasePrice: 850,
    sellingPrice: 1200,
    minimumStock: 10,
  },
  {
    id: 3,
    name: "Office Chair",
    sku: "CHR001",
    category: "Furniture",
    stock: 4,
    purchasePrice: 2500,
    sellingPrice: 3500,
    minimumStock: 5,
  },
  {
    id: 4,
    name: "USB Cable",
    sku: "USB001",
    category: "Accessories",
    stock: 0,
    purchasePrice: 80,
    sellingPrice: 150,
    minimumStock: 10,
  },
];

const movements: Movement[] = [
  {
    id: 1,
    product: "ABC Product",
    type: "IN",
    quantity: 10,
    date: "26 Sep 2026",
    reference: "PUR-001",
  },
  {
    id: 2,
    product: "Premium Product",
    type: "OUT",
    quantity: 3,
    date: "26 Sep 2026",
    reference: "INV-004",
  },
  {
    id: 3,
    product: "Office Chair",
    type: "IN",
    quantity: 5,
    date: "25 Sep 2026",
    reference: "PUR-002",
  },
  {
    id: 4,
    product: "USB Cable",
    type: "OUT",
    quantity: 10,
    date: "25 Sep 2026",
    reference: "INV-003",
  },
];

export default function InventoryPage() {
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const value = search.toLowerCase();

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(value) ||
        product.sku.toLowerCase().includes(value) ||
        product.category.toLowerCase().includes(value),
    );
  }, [search]);

  const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);

  const stockValue = products.reduce(
    (sum, product) => sum + product.stock * product.purchasePrice,
    0,
  );

  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= product.minimumStock,
  );

  const outOfStock = products.filter((product) => product.stock === 0);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Products"
            value={products.length.toString()}
            icon={<Package size={20} />}
          />

          <StatCard
            title="Total Units"
            value={totalUnits.toLocaleString("en-IN")}
            icon={<Boxes size={20} />}
          />

          <StatCard
            title="Stock Value"
            value={`₹${stockValue.toLocaleString("en-IN")}`}
            icon={<ArrowUp size={20} />}
          />

          <StatCard
            title="Low / Out of Stock"
            value={`${lowStock.length + outOfStock.length}`}
            icon={<AlertTriangle size={20} />}
          />
        </div>

        {/* Alerts */}
        {(lowStock.length > 0 || outOfStock.length > 0) && (
          <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-5">
            <div className="flex gap-3">
              <AlertTriangle size={21} className="mt-0.5 text-yellow-600" />

              <div>
                <h3 className="font-semibold text-yellow-900">
                  Inventory alerts
                </h3>

                <p className="mt-1 text-sm text-yellow-800">
                  {outOfStock.length > 0 &&
                    `${outOfStock.length} product(s) are out of stock. `}
                  {lowStock.length > 0 &&
                    `${lowStock.length} product(s) are running low.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Product Stock */}
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Stock Overview</h2>

            <p className="text-sm text-slate-500">
              Current stock of all products
            </p>
          </div>

          <div className="mb-4 rounded-xl border bg-white p-4">
            <div className="relative max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search product, SKU or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border bg-white">
            <div className="hidden grid-cols-6 border-b bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
              <span>Product</span>
              <span>SKU</span>
              <span>Category</span>
              <span>Stock</span>
              <span>Purchase Value</span>
              <span>Status</span>
            </div>

            {filteredProducts.map((product) => {
              const isOut = product.stock === 0;
              const isLow =
                product.stock > 0 && product.stock <= product.minimumStock;

              return (
                <div
                  key={product.id}
                  className="grid gap-3 border-b px-6 py-4 last:border-b-0 md:grid-cols-6 md:items-center"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {product.name}
                    </p>
                  </div>

                  <div className="text-sm text-slate-600">{product.sku}</div>

                  <div className="text-sm text-slate-600">
                    {product.category}
                  </div>

                  <div className="font-semibold text-slate-900">
                    {product.stock} units
                  </div>

                  <div className="text-sm text-slate-600">
                    ₹
                    {(product.stock * product.purchasePrice).toLocaleString(
                      "en-IN",
                    )}
                  </div>

                  <div>
                    {isOut ? (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                        Out of stock
                      </span>
                    ) : isLow ? (
                      <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                        Low stock
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                        In stock
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Stock Movements */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Recent Stock Movements
            </h2>

            <p className="text-sm text-slate-500">
              Recent inventory additions and reductions
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border bg-white">
            {movements.map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between border-b px-6 py-4 last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      movement.type === "IN" ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    {movement.type === "IN" ? (
                      <ArrowDown size={18} className="text-green-600" />
                    ) : (
                      <ArrowUp size={18} className="text-red-600" />
                    )}
                  </div>

                  <div>
                    <p className="font-medium text-slate-900">
                      {movement.product}
                    </p>

                    <p className="text-xs text-slate-500">
                      {movement.reference} · {movement.date}
                    </p>
                  </div>
                </div>

                <div
                  className={`font-semibold ${
                    movement.type === "IN" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {movement.type === "IN" ? "+" : "-"}
                  {movement.quantity}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>

        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">{icon}</div>
      </div>

      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
