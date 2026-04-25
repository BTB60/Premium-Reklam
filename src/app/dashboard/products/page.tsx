"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { productApi, type Product } from "@/lib/authApi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { ShoppingBag, Plus, RefreshCw } from "lucide-react";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productApi.getActiveCatalog();
      setProducts(data);
    } catch (error) {
      console.error("Load products error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Məhsullar</h1>
        <Button onClick={loadProducts} variant="ghost" size="sm" icon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}>
          Yenilə
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-[#D90429]" />
        </div>
      ) : products.length === 0 ? (
        <Card className="p-16 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1F2937] mb-2">Məhsul yoxdur</h3>
          <p className="text-[#6B7280]">Admin məhsul əlavə edəcək</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card 
              key={product.id} 
              className="p-5 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/orders/new?productId=${product.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-[#D90429]/10 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-[#D90429]" />
                </div>
                <span className="text-xs bg-gray-100 text-[#6B7280] px-2 py-1 rounded">
                  {product.category}
                </span>
              </div>
              <h3 className="font-bold text-[#1F2937] mb-1">{product.name}</h3>
              <p className="text-sm text-[#6B7280] mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-[#D90429]">{product.salePrice} AZN</span>
                <span className="text-xs text-[#6B7280]">/{product.unit}</span>
              </div>
              {product.width && product.height && (
                <p className="text-xs text-[#6B7280] mt-2">
                  Standart: {product.width}m × {product.height}m
                </p>
              )}
              <Button 
                className="w-full mt-4" 
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/orders/new?productId=${product.id}`);
                }}
              >
                Sifariş Et
              </Button>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}