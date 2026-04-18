"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { getAdminBearerToken, getAdminDashboardApiBase } from "./admin-dashboard-api";
import type { DashboardProduct } from "./products-manager/types";
import { ProductsHeaderBar } from "./products-manager/ProductsHeaderBar";
import { ProductsFilterBar } from "./products-manager/ProductsFilterBar";
import { ProductForm } from "./products-manager/ProductForm";
import { ProductsTable } from "./products-manager/ProductsTable";

const API_BASE = getAdminDashboardApiBase();

function normalizeProductId(raw: unknown): number {
  if (raw == null) return Date.now();
  if (typeof raw === "number" && !Number.isNaN(raw)) return raw;
  if (typeof raw === "object" && raw !== null && "toString" in raw) {
    const n = Number(String((raw as { toString: () => string }).toString()));
    return Number.isNaN(n) ? Date.now() : n;
  }
  const n = Number(raw);
  return Number.isNaN(n) ? Date.now() : n;
}

export default function ProductsManager() {
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [status, setStatus] = useState("active");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const getToken = () => getAdminBearerToken();

  const loadProducts = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.products || [];

        const mapped: DashboardProduct[] = list.map((p: Record<string, unknown>) => ({
          ...p,
          id: normalizeProductId(p.id),
          unitPrice:
            p.salePrice !== undefined && p.salePrice !== null ? Number(p.salePrice as number) : 0,
          status: (p.status ? String(p.status).toLowerCase() : "active") as DashboardProduct["status"],
        })) as DashboardProduct[];

        setProducts(mapped);
        localStorage.setItem("decor_products", JSON.stringify(mapped));
      }
    } catch (error) {
      console.error("[Products] Load error:", error);
      const stored = localStorage.getItem("decor_products");
      if (stored) setProducts(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCategory("");
    setUnitPrice("0");
    setWidth("");
    setHeight("");
    setStatus("active");
    setDescription("");
    setImageUrl("");
    setFormError("");
  };

  const handleEdit = (product: DashboardProduct) => {
    setEditingId(Number(product.id));
    setName(product.name);
    setCategory(product.category || "");
    setUnitPrice(
      product.unitPrice !== undefined && product.unitPrice !== null ? String(product.unitPrice) : "0"
    );
    setWidth(product.width !== undefined && product.width !== null ? String(product.width) : "");
    setHeight(product.height !== undefined && product.height !== null ? String(product.height) : "");
    setStatus(product.status || "active");
    setDescription(product.description || "");
    setImageUrl(product.imageUrl || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Ad tələb olunur");
      return;
    }

    const priceValue = parseFloat(unitPrice);
    const finalPrice = Number.isNaN(priceValue) || priceValue < 0 ? 0 : priceValue;
    const widthValue = width === "" ? undefined : parseFloat(width);
    const heightValue = height === "" ? undefined : parseFloat(height);

    const requestBody = {
      name: name.trim(),
      description: description.trim() || "",
      category: category.trim() || "Banner",
      salePrice: finalPrice,
      width: widthValue,
      height: heightValue,
      status: status.toUpperCase(),
      imageUrl: imageUrl.trim() || "",
    };

    console.log("=== [PRODUCTS] SAVING ===");
    console.log("Editing ID:", editingId);
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    try {
      const token = getToken();
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_BASE}/products/${editingId}` : `${API_BASE}/products`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await res.text();
      console.log("Response status:", res.status);

      if (res.ok) {
        const savedProduct = responseText ? JSON.parse(responseText) : {};

        let updated: DashboardProduct[];
        if (editingId) {
          updated = products.map((p) =>
            p.id === editingId
              ? {
                  ...p,
                  name: requestBody.name,
                  description: requestBody.description,
                  category: requestBody.category,
                  unitPrice: requestBody.salePrice,
                  width: requestBody.width,
                  height: requestBody.height,
                  status: requestBody.status.toLowerCase() as DashboardProduct["status"],
                  imageUrl: requestBody.imageUrl,
                  updatedAt: new Date().toISOString(),
                }
              : p
          );
        } else {
          const newProduct: DashboardProduct = {
            id: normalizeProductId(savedProduct.id),
            name: requestBody.name,
            description: requestBody.description,
            category: requestBody.category,
            unitPrice: requestBody.salePrice,
            width: requestBody.width,
            height: requestBody.height,
            status: requestBody.status.toLowerCase() as DashboardProduct["status"],
            imageUrl: requestBody.imageUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          updated = [...products, newProduct];
        }

        setProducts(updated);
        localStorage.setItem("decor_products", JSON.stringify(updated));

        setShowForm(false);
        setEditingId(null);
        resetForm();
        setFormError("Yadda saxlandı: " + finalPrice + " AZN");
      } else {
        console.error("Backend error:", res.status, responseText);
        throw new Error(responseText || `HTTP ${res.status}`);
      }
    } catch (error: unknown) {
      console.error("[Products] Save error:", error);

      let updated: DashboardProduct[];
      if (editingId) {
        updated = products.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: requestBody.name,
                unitPrice: requestBody.salePrice,
                status: requestBody.status.toLowerCase() as DashboardProduct["status"],
                updatedAt: new Date().toISOString(),
              }
            : p
        );
      } else {
        updated = [
          ...products,
          {
            id: Date.now(),
            name: requestBody.name,
            unitPrice: requestBody.salePrice,
            status: requestBody.status.toLowerCase() as DashboardProduct["status"],
            category: requestBody.category,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      }

      setProducts(updated);
      localStorage.setItem("decor_products", JSON.stringify(updated));

      setShowForm(false);
      setEditingId(null);
      resetForm();
      setFormError("Yadda saxlandı (lokal): " + requestBody.salePrice + " AZN");
    }

    console.log("=== [PRODUCTS] END ===");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Məhsulu silmək istədiyinizə əminsiniz?")) return;

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await loadProducts();
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      localStorage.setItem("decor_products", JSON.stringify(updated));
    }
  };

  const filteredProducts = products.filter((p) => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D90429] mx-auto" />
      </Card>
    );
  }

  return (
    <div>
      <ProductsHeaderBar
        onNewProduct={() => {
          setEditingId(null);
          setShowForm(true);
          resetForm();
        }}
      />
      <ProductsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        resultCount={filteredProducts.length}
      />

      {showForm && (
        <ProductForm
          editingId={editingId}
          formError={formError}
          name={name}
          setName={setName}
          category={category}
          setCategory={setCategory}
          unitPrice={unitPrice}
          setUnitPrice={setUnitPrice}
          width={width}
          setWidth={setWidth}
          height={height}
          setHeight={setHeight}
          status={status}
          setStatus={setStatus}
          description={description}
          setDescription={setDescription}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
            resetForm();
          }}
        />
      )}

      <ProductsTable products={filteredProducts} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}
