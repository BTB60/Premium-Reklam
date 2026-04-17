// src/lib/db/products.ts

import { Product, ProductCategory, OrderTemplate } from "./types";
import { getFromStorage, saveToStorage } from "./storage";

const PRODUCTS_KEY = "decor_products";
const CATEGORIES_KEY = "decor_categories";
const TEMPLATES_KEY = "decor_templates";

function getProducts(): Product[] {
  return getFromStorage<Product[]>(PRODUCTS_KEY, []);
}

function saveProducts(products: Product[]) {
  saveToStorage(PRODUCTS_KEY, products);
}

function getCategories(): ProductCategory[] {
  const raw = getFromStorage<ProductCategory[]>(CATEGORIES_KEY, null);
  if (raw) return raw;
  const defaults: ProductCategory[] = [
    { id: "1", name: "Vinil Banner", description: "Reklam bannerləri", order: 1 },
    { id: "2", name: "Orakal", description: "Kəsiləbilən plenka", order: 2 },
    { id: "3", name: "Laminasiya", description: "Məhsul laminasiyası", order: 3 },
    { id: "4", name: "Karton", description: "Reklam kartonları", order: 4 },
    { id: "5", name: "Plexi", description: "Akril materiallar", order: 5 },
  ];
  saveToStorage(CATEGORIES_KEY, defaults);
  return defaults;
}

function saveCategories(categories: ProductCategory[]) {
  saveToStorage(CATEGORIES_KEY, categories);
}

function getTemplates(): OrderTemplate[] {
  return getFromStorage<OrderTemplate[]>(TEMPLATES_KEY, []);
}

function saveTemplates(templates: OrderTemplate[]) {
  saveToStorage(TEMPLATES_KEY, templates);
}

export const products = {
  getAll(): Product[] {
    return getProducts();
  },
  getActive(): Product[] {
    return getProducts().filter(p => p.isActive);
  },
  getByCategory(categoryId: string): Product[] {
    return getProducts().filter(p => p.category === categoryId && p.isActive);
  },
  getById(id: string): Product | undefined {
    return getProducts().find(p => p.id === id);
  },
  
  create(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Product {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // ✅ Гарантируем, что costPrice сохранится (даже если 0 или undefined)
      costPrice: product.costPrice !== undefined ? product.costPrice : undefined,
    };
    const all = getProducts();
    all.push(newProduct);
    saveProducts(all);
    return newProduct;
  },
  
  update(id: string, updates: Partial<Product>): Product | null {
    const all = getProducts();
    const index = all.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    // ✅ Сохраняем costPrice, если он передан в updates
    const updatedProduct = { 
      ...all[index], 
      ...updates, 
      updatedAt: new Date().toISOString(),
      // Если costPrice явно передан (даже 0) — обновляем, иначе оставляем старое значение
      ...(updates.costPrice !== undefined ? { costPrice: updates.costPrice } : {}),
    };
    
    all[index] = updatedProduct;
    saveProducts(all);
    return updatedProduct;
  },
  
  delete(id: string): boolean {
    const all = getProducts().filter(p => p.id !== id);
    if (all.length === getProducts().length) return false;
    saveProducts(all);
    return true;
  },
  
  getCategories(): ProductCategory[] {
    return getCategories();
  },
  
  createCategory(category: Omit<ProductCategory, "id">): ProductCategory {
    const newCategory: ProductCategory = { ...category, id: Date.now().toString() };
    const all = getCategories();
    all.push(newCategory);
    saveCategories(all);
    return newCategory;
  },
  
  updateCategory(id: string, updates: Partial<ProductCategory>): ProductCategory | null {
    const all = getCategories();
    const index = all.findIndex(c => c.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    saveCategories(all);
    return all[index];
  },
  
  deleteCategory(id: string): boolean {
    const all = getCategories().filter(c => c.id !== id);
    if (all.length === getCategories().length) return false;
    saveCategories(all);
    return true;
  },
  
  // ✅ НОВЫЙ МЕТОД: Расчёт прибыли по товару
  calculateProfit(product: Product, quantity: number, totalArea?: number): {
    revenue: number;
    cost: number;
    profit: number;
    margin: number; // в процентах
  } {
    const salePrice = product.basePrice;
    const costPrice = product.costPrice ?? 0;
    
    // Для товаров с площадью: цена за м² × площадь
    const units = product.unit === "m²" && totalArea ? totalArea : quantity;
    
    const revenue = salePrice * units;
    const cost = costPrice * units;
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    return {
      revenue: Math.round(revenue * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      margin: Math.round(margin * 100) / 100,
    };
  },
  
  // ✅ НОВЫЙ МЕТОД: Агрегированная статистика по всем товарам
  getProfitStats(orderItems: Array<{ productId: string; quantity: number; width?: number; height?: number }>): {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    avgMargin: number;
  } {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let margins: number[] = [];
    
    orderItems.forEach(item => {
      const product = this.getById(item.productId);
      if (!product) return;
      
      const area = item.width && item.height ? item.width * item.height : undefined;
      const stats = this.calculateProfit(product, item.quantity, area);
      
      totalRevenue += stats.revenue;
      totalCost += stats.cost;
      totalProfit += stats.profit;
      if (stats.revenue > 0) margins.push(stats.margin);
    });
    
    const avgMargin = margins.length > 0 
      ? margins.reduce((a, b) => a + b, 0) / margins.length 
      : 0;
    
    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      avgMargin: Math.round(avgMargin * 100) / 100,
    };
  },
};

export const templates = {
  getByUserId(userId: string): OrderTemplate[] {
    return getTemplates().filter(t => t.userId === userId);
  },
  getById(id: string): OrderTemplate | undefined {
    return getTemplates().find(t => t.id === id);
  },
  create(template: Omit<OrderTemplate, "id" | "createdAt">): OrderTemplate {
    const newTemplate: OrderTemplate = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const all = getTemplates();
    all.push(newTemplate);
    saveTemplates(all);
    return newTemplate;
  },
  update(id: string, updates: Partial<OrderTemplate>): OrderTemplate | null {
    const all = getTemplates();
    const index = all.findIndex(t => t.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    saveTemplates(all);
    return all[index];
  },
  delete(id: string): boolean {
    const all = getTemplates().filter(t => t.id !== id);
    if (all.length === getTemplates().length) return false;
    saveTemplates(all);
    return true;
  },
};