"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { vendorStores, vendorProducts, type VendorStore, type VendorProduct } from "@/lib/db";
import {
  getMarketplaceProductFilterCategories,
  MARKETPLACE_PRODUCT_CATEGORIES_EVENT,
} from "@/lib/vendorStoreCategories";
import {
  compareVendorStoresByHighlight,
  getVipExpiryDisplay,
  highlightTierBadgeClass,
  highlightTierLabel,
  getEffectiveHighlightTier,
  vendorHighlightRankForStore,
} from "@/lib/vendorStoreHighlight";
import { motion } from "framer-motion";
import {
  Search,
  Store,
  ShoppingBag,
  Star,
  MapPin,
  Phone,
  ArrowRight,
  Filter,
  Grid3X3,
  List,
  Heart,
} from "lucide-react";
import Link from "next/link";

export default function MarketplacePage() {
  const [stores, setStores] = useState<VendorStore[]>([]);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"stores" | "products">("stores");
  const [categoryTick, setCategoryTick] = useState(0);

  useEffect(() => {
    const load = () => {
      setStores(vendorStores.getAll());
      setProducts(vendorProducts.getAll());
    };
    load();
    const onCats = () => {
      setCategoryTick((n) => n + 1);
      load();
    };
    window.addEventListener(MARKETPLACE_PRODUCT_CATEGORIES_EVENT, onCats);
    return () => window.removeEventListener(MARKETPLACE_PRODUCT_CATEGORIES_EVENT, onCats);
  }, []);

  const productCategories = useMemo(
    () => ["all", ...getMarketplaceProductFilterCategories(products, stores)],
    [products, stores, categoryTick]
  );

  const filteredStores = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return stores
      .filter(
        (store) =>
          store.name.toLowerCase().includes(q) || store.description.toLowerCase().includes(q)
      )
      .sort(compareVendorStoresByHighlight);
  }, [stores, searchQuery]);

  const storeRankById = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of stores) m.set(String(s.id), vendorHighlightRankForStore(s));
    return m;
  }, [stores]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return products
      .filter(
        (product) =>
          (selectedCategory === "all" ||
            (product.category || "").trim() === selectedCategory) &&
          (product.name.toLowerCase().includes(q) ||
            product.description.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        const ra = storeRankById.get(String(a.storeId)) ?? 1;
        const rb = storeRankById.get(String(b.storeId)) ?? 1;
        if (ra !== rb) return rb - ra;
        return a.name.localeCompare(b.name, "az");
      });
  }, [products, selectedCategory, searchQuery, storeRankById]);

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#D90429] to-[#EF476F] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Dekor Marketplace
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Professional dekorçulardan birbaşa alış-veriş edin. 
              100+ mağaza, minlərlə məhsul.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <Store className="w-5 h-5" />
                <span>{stores.length}+ Mağaza</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <ShoppingBag className="w-5 h-5" />
                <span>{products.length}+ Məhsul</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-6 bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Mağaza və ya məhsul axtar..."
                value={searchQuery}
                onChange={(value) => setSearchQuery(value)}
                className="pl-10"
              />
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("stores")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "stores"
                    ? "bg-white text-[#D90429] shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Mağazalar
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "products"
                    ? "bg-white text-[#D90429] shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Məhsullar
              </button>
            </div>

            {/* View Mode */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg ${
                  viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg ${
                  viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Category Filter */}
          {activeTab === "products" && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {productCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-[#D90429] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat === "all" ? "Bütün Kateqoriyalar" : cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === "stores" ? (
            /* Stores Grid */
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {filteredStores.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Mağaza tapılmadı</p>
                </div>
              ) : (
                filteredStores.map((store) => (
                  <StoreCard key={store.id} store={store} viewMode={viewMode} />
                ))
              )}
            </div>
          ) : (
            /* Products Grid */
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-1"
              }`}
            >
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Məhsul tapılmadı</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Store Card Component
function StoreCard({
  store,
  viewMode,
}: {
  store: VendorStore;
  viewMode: "grid" | "list";
}) {
  const tier = getEffectiveHighlightTier(store);
  const showTierBadge = tier !== "standard";
  const vipUntil = getVipExpiryDisplay(store);

  if (viewMode === "list") {
    return (
      <Card className="p-4 flex gap-4">
        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Store className="w-10 h-10 text-gray-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg">{store.name}</h3>
                {showTierBadge ? (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${highlightTierBadgeClass(tier)}`}
                  >
                    {highlightTierLabel(tier)}
                  </span>
                ) : null}
              </div>
              {tier === "vip" && vipUntil ? (
                <p className="text-xs text-amber-700 mt-1">VIP bitir: {vipUntil}</p>
              ) : null}
              <p className="text-gray-500 text-sm line-clamp-2">
                {store.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {store.address}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {store.phone}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-bold">{store.rating.toFixed(1)}</span>
              </div>
              <p className="text-sm text-gray-500">{store.reviewCount} rəy</p>
              <p className="text-sm text-gray-500">{store.totalSales} satış</p>
            </div>
          </div>
          <Link href={`/store/${store.id}`}>
            <Button variant="ghost" className="mt-3" icon={<ArrowRight className="w-4 h-4" />}>
              Mağazaya bax
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden group">
      <div className="h-32 bg-gradient-to-r from-[#D90429] to-[#EF476F] relative">
        {showTierBadge ? (
          <span
            className={`absolute top-2 right-2 z-10 text-xs font-bold px-2 py-1 rounded-full ${highlightTierBadgeClass(tier)}`}
          >
            {highlightTierLabel(tier)}
          </span>
        ) : null}
        <div className="absolute -bottom-8 left-4">
          <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center">
            <Store className="w-8 h-8 text-[#D90429]" />
          </div>
        </div>
      </div>
      <div className="pt-10 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">{store.name}</h3>
            {tier === "vip" && vipUntil ? (
              <p className="text-[11px] text-amber-700 mt-0.5">VIP: {vipUntil}-dək</p>
            ) : null}
            <p className="text-gray-500 text-sm line-clamp-2 mt-1">
              {store.description}
            </p>
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-bold text-sm">{store.rating.toFixed(1)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-sm mt-3">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{store.address}</span>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <span className="text-sm text-gray-500">{store.totalSales} satış</span>
          <Link href={`/store/${store.id}`}>
            <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              Bax
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

// Product Card Component
function ProductCard({
  product,
  viewMode,
}: {
  product: VendorProduct;
  viewMode: "grid" | "list";
}) {
  const store = vendorStores.getById(product.storeId);

  if (viewMode === "list") {
    return (
      <Card className="p-4 flex gap-4">
        <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-lg">{product.name}</h3>
              <p className="text-gray-500 text-sm">{store?.name}</p>
              <p className="text-gray-600 mt-2 line-clamp-2">{product.description}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#D90429]">
                {product.price.toFixed(2)} AZN
              </p>
              <p className="text-sm text-gray-500">/{product.unit}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span
              className={`text-sm ${
                product.stock > 0 ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {product.stock > 0 ? `Stok: ${product.stock}` : "Stok bitib"}
            </span>
            <Link href={`/store/${product.storeId}?product=${product.id}`}>
              <Button icon={<ShoppingBag className="w-4 h-4" />}>
                Sifariş Et
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden group">
      <div className="aspect-square bg-gray-100 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <ShoppingBag className="w-16 h-16 text-gray-300" />
        </div>
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold">Stok Bitib</span>
          </div>
        )}
        <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
          <Heart className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500">{store?.name}</p>
        <h3 className="font-bold mt-1 line-clamp-2">{product.name}</h3>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-xl font-bold text-[#D90429]">
            {product.price.toFixed(2)} AZN
          </span>
          <span className="text-sm text-gray-500">/{product.unit}</span>
        </div>
        <Link href={`/store/${product.storeId}?product=${product.id}`}>
          <Button className="w-full mt-3" size="sm" icon={<ShoppingBag className="w-4 h-4" />}>
            Sifariş Et
          </Button>
        </Link>
      </div>
    </Card>
  );
}
