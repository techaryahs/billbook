"use client";

import { useMemo, useState, useEffect } from "react";
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
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  minimumStock: number;
};

type Movement = {
  id: string;
  product: string;
  type: "IN" | "OUT";
  quantity: number;
  date: string;
  reference: string;
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch inventory");
      }
      setProducts(json.data.products || []);
      setMovements(json.data.movements || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredProducts = useMemo(() => {
    const value = search.toLowerCase();

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(value) ||
        (product.sku && product.sku.toLowerCase().includes(value)) ||
        (product.category && product.category.toLowerCase().includes(value)),
    );
  }, [search, products]);

  const totalUnits = products.reduce((sum, product) => sum + (product.stock || 0), 0);

  const stockValue = products.reduce(
    (sum, product) => sum + (product.stock || 0) * (product.purchasePrice || 0),
    0,
  );

  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= product.minimumStock,
  );

  const outOfStock = products.filter((product) => product.stock <= 0);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-6">
        
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Products"
            value={isLoading ? "..." : products.length.toString()}
            icon={<Package size={20} />}
          />

          <StatCard
            title="Total Units"
            value={isLoading ? "..." : totalUnits.toLocaleString("en-IN")}
            icon={<Boxes size={20} />}
          />

          <StatCard
            title="Stock Value"
            value={isLoading ? "..." : `₹${stockValue.toLocaleString("en-IN")}`}
            icon={<ArrowUp size={20} />}
          />

          <StatCard
            title="Low / Out of Stock"
            value={isLoading ? "..." : `${lowStock.length + outOfStock.length}`}
            icon={<AlertTriangle size={20} />}
          />
        </div>

        {/* Alerts */}
        {!isLoading && (lowStock.length > 0 || outOfStock.length > 0) && (
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

            {isLoading ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <p className="mt-4 text-sm text-slate-500">Loading inventory...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Package size={40} className="mx-auto text-slate-300" />
                <h3 className="mt-4 font-semibold text-slate-900">
                  {search ? "No matching products found" : "No products found"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {search
                    ? "Try a different search term"
                    : "Add products to see them in your inventory."}
                </p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isOut = product.stock <= 0;
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

                    <div className="text-sm text-slate-600">{product.sku || "—"}</div>

                    <div className="text-sm text-slate-600">
                      {product.category || "General"}
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
              })
            )}
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
            {isLoading ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <p className="mt-4 text-sm text-slate-500">Loading movements...</p>
              </div>
            ) : movements.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <h3 className="font-semibold text-slate-900">
                  No stock movements
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Record purchases or sales to see inventory movements here.
                </p>
              </div>
            ) : (
              movements.map((movement) => (
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
                        {movement.reference} · {new Intl.DateTimeFormat("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(movement.date))}
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
              ))
            )}
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
