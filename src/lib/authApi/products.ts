// src/lib/authApi/products.ts
import { Product } from './types';
import { saveWithFallback } from './storage';
import { products as mockProducts } from '../db/products';
import { BASE_URL } from './config';

export const productApi = {
  async create(product: Partial<Product>): Promise<Product> {
    const backendPayload = {
      name: product.name?.trim(),
      sku: `PRD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category: product.category?.trim() || "Banner",
      description: product.description?.trim() || "",
      unit: (() => {
        const u = (product.unit || "M2").toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (u === "M2" || u === "M²" || u === "METERSQUARED") return "M2";
        if (u === "PIECE" || u === "EDEd" || u === "PCS") return "PIECE";
        if (u === "METER" || u === "METR" || u === "LINEARMETER") return "METER";
        if (u === "KG" || u === "KILOGRAM") return "KG";
        if (u === "LITER" || u === "LITR") return "LITER";
        if (u === "BOX") return "BOX";
        if (u === "SET") return "SET";
        return "M2";
      })(),
      purchasePrice: product.costPrice !== undefined ? Number(product.costPrice) : 0,
      salePrice: Number(product.basePrice ?? product.salePrice ?? product.unitPrice ?? 0),
      stockQuantity: product.stockQuantity !== undefined ? Number(product.stockQuantity) : 999,
      minStockLevel: product.minStockLevel !== undefined ? Number(product.minStockLevel) : 10,
      width: product.width !== undefined ? Number(product.width) : null,
      height: product.height !== undefined ? Number(product.height) : null,
    };

    return saveWithFallback('/products', backendPayload, (data) => {
      // Фоллбэк: products.create() возвращает Product
      return mockProducts.create({ 
        ...product, 
        id: undefined, 
        createdAt: undefined, 
        updatedAt: undefined 
      });
    });
  },

  async getAll(): Promise<Product[]> {
    return saveWithFallback('/products', null, () => mockProducts.getAll());
  }
};