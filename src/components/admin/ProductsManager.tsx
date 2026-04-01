"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { productApi, type Product } from "@/lib/authApi";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  Tag,
  DollarSign,
  CheckCircle,
  XCircle,
  Folder,
  RefreshCw,
} from "lucide-react";

interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  order?: number;
  slug?: string;
}

interface ProductsManagerProps {
  initialProducts?: Product[];
  initialCategories?: ProductCategory[];
}

export function ProductsManager({ initialProducts = [], initialCategories = [] }: ProductsManagerProps) {
  const [productList, setProductList] = useState<Product[]>(initialProducts);
  const [categoryList, setCategoryList] = useState<ProductCategory[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product Form State - WITH STOCK FIELDS
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    category: "",
    basePrice: "",
    unit: "M2" as string,
    minOrder: "1",
    stockQuantity: "",
    minStockLevel: "10",
    isActive: true,
  });

  // Category Form State
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    order: "",
  });

  // Load products from backend on mount
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const products = await productApi.getAll();
      setProductList(products);
      setError(null);
    } catch (err: any) {
      console.error("Məhsullar yüklənərkən xəta:", err);
      setError("Məhsullar yüklənə bilmədi");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categories = await productApi.getCategories();
      setCategoryList(categories.map((name: string, index: number) => ({
        id: (index + 1).toString(),
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        order: index + 1,
      })));
    } catch (err: any) {
      console.error("Kateqoriyalar yüklənərkən xəta:", err);
    }
  };

  const filteredProducts = productList.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProduct = async () => {
    if (!productForm.name || !productForm.basePrice) {
      alert("Ad və qiymət mütləq daxil edilməlidir!");
      return;
    }

    try {
      setLoading(true);
      const newProduct = await productApi.create({
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        sku: `SKU-${Date.now()}`,
        purchasePrice: parseFloat(productForm.basePrice) * 0.6,
        salePrice: parseFloat(productForm.basePrice),
        stockQuantity: parseFloat(productForm.stockQuantity) || 0,
        minStockLevel: parseFloat(productForm.minStockLevel) || 10,
        unit: productForm.unit || "M2",
        status: productForm.isActive ? "ACTIVE" : "INACTIVE",
      });

      setProductList([...productList, newProduct]);
      setShowProductForm(false);
      resetProductForm();
      setError(null);
    } catch (err: any) {
      console.error("Məhsul yaradılarkən xəta:", err);
      setError("Məhsul yaradıla bilmədi: " + (err.message || "Xəta"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !productForm.name) return;

    try {
      setLoading(true);
      const updated = await productApi.update(editingProduct.id, {
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        purchasePrice: parseFloat(productForm.basePrice) * 0.6,
        salePrice: parseFloat(productForm.basePrice),
        stockQuantity: parseFloat(productForm.stockQuantity) || 0,
        minStockLevel: parseFloat(productForm.minStockLevel) || 10,
        unit: productForm.unit || "M2",
        status: productForm.isActive ? "ACTIVE" : "INACTIVE",
      });

      if (updated) {
        setProductList(productList.map((p) => (p.id === updated.id ? updated : p)));
      }
      setShowProductForm(false);
      setEditingProduct(null);
      resetProductForm();
      setError(null);
    } catch (err: any) {
      console.error("Məhsul yenilənərkən xəta:", err);
      setError("Məhsul yenilənə bilmədi: " + (err.message || "Xəta"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Məhsulu silmək istədiyinizə əminsiniz?")) return;

    try {
      setLoading(true);
      await productApi.delete(id);
      setProductList(productList.filter((p) => p.id !== id));
      setError(null);
    } catch (err: any) {
      console.error("Məhsul silinərkən xəta:", err);
      setError("Məhsul silinə bilmədi: " + (err.message || "Xəta"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name) {
      alert("Kateqoriya adı daxil edin!");
      return;
    }

    const newCategory: ProductCategory = {
      id: Date.now().toString(),
      name: categoryForm.name,
      description: categoryForm.description,
      order: parseInt(categoryForm.order) || categoryList.length + 1,
      slug: categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
    };

    setCategoryList([...categoryList, newCategory]);
    setShowCategoryForm(false);
    resetCategoryForm();
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !categoryForm.name) return;

    const updated: ProductCategory = {
      ...editingCategory,
      name: categoryForm.name,
      description: categoryForm.description,
      order: parseInt(categoryForm.order) || editingCategory.order,
    };

    setCategoryList(categoryList.map((c) => (c.id === updated.id ? updated : c)));
    setShowCategoryForm(false);
    setEditingCategory(null);
    resetCategoryForm();
  };

  const handleDeleteCategory = (id: string) => {
    if (!confirm("Kateqoriyanı silmək istədiyinizə əminsiniz?")) return;
    setCategoryList(categoryList.filter((c) => c.id !== id));
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      category: "",
      basePrice: "",
      unit: "M2",
      minOrder: "1",
      stockQuantity: "",
      minStockLevel: "10",
      isActive: true,
    });
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", description: "", order: "" });
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "",
      basePrice: (product.salePrice || 0).toString(),
      unit: product.unit || "M2",
      stockQuantity: (product.stockQuantity || 0).toString(),
      minStockLevel: (product.minStockLevel || 10).toString(),
      minOrder: "1",
      isActive: product.status === "ACTIVE",
    });
    setShowProductForm(true);
  };

  const startEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      order: (category.order || 1).toString(),
    });
    setShowCategoryForm(true);
  };

  const getCategoryName = (id: string) => {
    return categoryList.find((c) => c.id === id)?.name || "Ümumi";
  };

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 font-medium ${
            activeTab === "products"
              ? "text-[#D90429] border-b-2 border-[#D90429]"
              : "text-gray-500"
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Məhsullar ({productList.length})
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 font-medium ${
            activeTab === "categories"
              ? "text-[#D90429] border-b-2 border-[#D90429]"
              : "text-gray-500"
          }`}
        >
          <Folder className="w-4 h-4 inline mr-2" />
          Kateqoriyalar ({categoryList.length})
        </button>
        <div className="flex-1" />
        <button
          onClick={loadProducts}
          className="p-2 text-gray-500 hover:text-[#D90429]"
          title="Yenilə"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === "products" && (
        <>
          {/* Search and Add */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Məhsul axtar..."
                value={searchQuery}
                onChange={(value) => setSearchQuery(value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => {
                setEditingProduct(null);
                resetProductForm();
                setShowProductForm(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Yeni Məhsul
            </Button>
          </div>

          {/* Product Form */}
          {showProductForm && (
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">
                {editingProduct ? "Məhsulu Redaktə Et" : "Yeni Məhsul"}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ad *</label>
                  <Input
                    value={productForm.name}
                    onChange={(value) => setProductForm({ ...productForm, name: value })}
                    placeholder="Məhsul adı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kateqoriya</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Seçin</option>
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Satış Qiyməti (AZN) *</label>
                  <Input
                    type="number"
                    value={productForm.basePrice}
                    onChange={(value) => setProductForm({ ...productForm, basePrice: value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vahid</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="M2">M² (kvadrat metr)</option>
                    <option value="PIECE">Ədəd</option>
                    <option value="METER">Metr</option>
                    <option value="KG">Kq</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stok Sayı</label>
                  <Input
                    type="number"
                    value={productForm.stockQuantity}
                    onChange={(value) => setProductForm({ ...productForm, stockQuantity: value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Stok Səviyyəsi</label>
                  <Input
                    type="number"
                    value={productForm.minStockLevel}
                    onChange={(value) => setProductForm({ ...productForm, minStockLevel: value })}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Sifariş</label>
                  <Input
                    type="number"
                    value={productForm.minOrder}
                    onChange={(value) => setProductForm({ ...productForm, minOrder: value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium">Aktiv</label>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium mb-1">Təsvir</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Məhsul təsviri..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                  icon={<CheckCircle className="w-4 h-4" />}
                  disabled={loading}
                >
                  {loading ? "Gözləyin..." : editingProduct ? "Yenilə" : "Yarat"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                  }}
                  icon={<XCircle className="w-4 h-4" />}
                >
                  Ləğv Et
                </Button>
              </div>
            </Card>
          )}

          {/* Products List */}
          <div className="grid gap-4">
            {loading && productList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Yüklənir...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Məhsul tapılmadı</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <Card key={product.id} className={`p-4 ${product.status !== "ACTIVE" ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold">{product.name}</h4>
                        {product.status === "ACTIVE" ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs rounded-full">
                            Aktiv
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                            Deaktiv
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                      <div className="flex gap-4 mt-2 text-sm flex-wrap">
                        <span className="flex items-center gap-1">
                          <Folder className="w-3 h-3" />
                          {getCategoryName(product.category || "")}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {(product.salePrice || 0).toFixed(2)} AZN / {product.unit || "M2"}
                        </span>
                        <span className={`flex items-center gap-1 ${(product.stockQuantity || 0) <= (product.minStockLevel || 10) ? 'text-orange-500' : 'text-green-600'}`}>
                          <Package className="w-3 h-3" />
                          Stok: {product.stockQuantity || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditProduct(product)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingCategory(null);
                resetCategoryForm();
                setShowCategoryForm(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Yeni Kateqoriya
            </Button>
          </div>

          {/* Category Form */}
          {showCategoryForm && (
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">
                {editingCategory ? "Kateqoriyanı Redaktə Et" : "Yeni Kateqoriya"}
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ad</label>
                  <Input
                    value={categoryForm.name}
                    onChange={(value) => setCategoryForm({ ...categoryForm, name: value })}
                    placeholder="Kateqoriya adı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sıra</label>
                  <Input
                    type="number"
                    value={categoryForm.order}
                    onChange={(value) => setCategoryForm({ ...categoryForm, order: value })}
                    placeholder="Sıra nömrəsi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Təsvir</label>
                  <Input
                    value={categoryForm.description}
                    onChange={(value) => setCategoryForm({ ...categoryForm, description: value })}
                    placeholder="Qısa təsvir"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  icon={<CheckCircle className="w-4 h-4" />}
                >
                  {editingCategory ? "Yenilə" : "Yarat"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                  }}
                  icon={<XCircle className="w-4 h-4" />}
                >
                  Ləğv Et
                </Button>
              </div>
            </Card>
          )}

          {/* Categories List */}
          <div className="grid gap-2">
            {categoryList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Kateqoriya yoxdur</p>
              </div>
            ) : (
              categoryList
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((category) => (
                  <Card key={category.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 bg-[#D90429] text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {category.order || 1}
                        </span>
                        <div>
                          <h4 className="font-bold">{category.name}</h4>
                          <p className="text-sm text-gray-500">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditCategory(category)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
