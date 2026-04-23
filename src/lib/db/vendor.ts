import { 
  VendorStore, StoreRequest, VendorProduct, VendorOrder, 
  Review, VendorWithdrawal 
} from "./types";
import { isTimedVipExpired, normalizeHighlightTier } from "@/lib/vendorStoreHighlight";
import { getFromStorage, saveToStorage } from "./storage";
import { notifications } from "./orders";
import { auth } from "./auth";

const VENDOR_STORES_KEY = "decor_vendor_stores";

function reconcileExpiredVipStores(all: VendorStore[]): VendorStore[] {
  let changed = false;
  const next = all.map((s) => {
    if (!isTimedVipExpired(s)) return s;
    changed = true;
    return {
      ...s,
      highlightTier: normalizeHighlightTier(s.tierAfterVip ?? "standard"),
      vipExpiresAt: null,
      tierAfterVip: undefined,
      updatedAt: new Date().toISOString(),
    };
  });
  if (changed) saveToStorage(VENDOR_STORES_KEY, next);
  return next;
}

function loadStoresReconciled(): VendorStore[] {
  const raw = getFromStorage<VendorStore[]>(VENDOR_STORES_KEY, []);
  return reconcileExpiredVipStores(raw);
}
const STORE_REQUESTS_KEY = "decor_store_requests";
const VENDOR_PRODUCTS_KEY = "decor_vendor_products";
const VENDOR_ORDERS_KEY = "decor_vendor_orders";
const VENDOR_WITHDRAWALS_KEY = "decor_vendor_withdrawals";
const REVIEWS_KEY = "decor_reviews";

// --- Vendor Stores ---
export const vendorStores = {
  getAll(): VendorStore[] {
    return loadStoresReconciled().filter((s) => s.isActive && s.isApproved);
  },
  getAllIncludingInactive(): VendorStore[] {
    return loadStoresReconciled();
  },
  getById(id: string): VendorStore | undefined {
    return loadStoresReconciled().find((s) => s.id === id);
  },
  getByVendorId(vendorId: string): VendorStore | undefined {
    return loadStoresReconciled().find((s) => s.vendorId === vendorId);
  },
  create(store: Omit<VendorStore, "id" | "createdAt" | "updatedAt" | "rating" | "reviewCount" | "totalSales">): VendorStore {
    const newStore: VendorStore = {
      ...store,
      highlightTier: normalizeHighlightTier(store.highlightTier),
      id: Date.now().toString(),
      rating: 0,
      reviewCount: 0,
      totalSales: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const all = loadStoresReconciled();
    all.push(newStore);
    saveToStorage(VENDOR_STORES_KEY, all);
    return newStore;
  },
  update(id: string, updates: Partial<VendorStore>): VendorStore | null {
    const all = loadStoresReconciled();
    const index = all.findIndex((s) => s.id === id);
    if (index === -1) return null;
    let next: VendorStore = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
    if (updates.highlightTier !== undefined && normalizeHighlightTier(updates.highlightTier) !== "vip") {
      next = { ...next, vipExpiresAt: null, tierAfterVip: undefined };
    }
    all[index] = next;
    saveToStorage(VENDOR_STORES_KEY, all);
    return all[index];
  },
  approve(id: string): VendorStore | null {
    return this.update(id, { isApproved: true, isActive: true });
  },
  reject(id: string): VendorStore | null {
    return this.update(id, { isApproved: false, isActive: false });
  },
};

// --- Store Requests ---
export const storeRequests = {
  getAll(): StoreRequest[] {
    return getFromStorage<StoreRequest[]>(STORE_REQUESTS_KEY, []);
  },
  getPending(): StoreRequest[] {
    return getFromStorage<StoreRequest[]>(STORE_REQUESTS_KEY, []).filter(r => r.status === "pending");
  },
  getByVendorId(vendorId: string): StoreRequest | undefined {
    return getFromStorage<StoreRequest[]>(STORE_REQUESTS_KEY, []).find(r => r.vendorId === vendorId);
  },
  getById(id: string): StoreRequest | undefined {
    return getFromStorage<StoreRequest[]>(STORE_REQUESTS_KEY, []).find(r => r.id === id);
  },
  create(request: Omit<StoreRequest, "id" | "createdAt" | "status" | "updatedAt">): StoreRequest {
    const existing = getFromStorage<StoreRequest[]>(STORE_REQUESTS_KEY, []).find(
      r => r.vendorId === request.vendorId && r.status === "pending"
    );
    if (existing) throw new Error("Sizin artıq gözləyən mağaza müraciətiniz var");
    
    const existingStore = vendorStores.getByVendorId(request.vendorId);
    if (existingStore?.isApproved) throw new Error("Sizin artıq təsdiqlənmiş mağazanız var");
    
    const newRequest: StoreRequest = {
      ...request,
      id: Date.now().toString(),
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const all = getFromStorage<StoreRequest[]>(STORE_REQUESTS_KEY, []);
    all.push(newRequest);
    saveToStorage(STORE_REQUESTS_KEY, all);
    return newRequest;
  },
  
  // ✅ НОВЫЙ МЕТОД: Обновление pending-заявки
  update(id: string, updates: Partial<Omit<StoreRequest, "id" | "vendorId" | "status" | "createdAt">>): StoreRequest | null {
    const all = getFromStorage<StoreRequest[]>(STORE_REQUESTS_KEY, []);
    const index = all.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    // Нельзя менять статус через update - для этого есть approve/reject
    const { status, createdAt, vendorId, ...safeUpdates } = updates as any;
    
    all[index] = { 
      ...all[index], 
      ...safeUpdates, 
      updatedAt: new Date().toISOString() 
    };
    saveToStorage(STORE_REQUESTS_KEY, all);
    return all[index];
  },
  
  approve(id: string, adminId: string): StoreRequest | null {
    const all = getFromStorage<StoreRequest[]>(STORE_REQUESTS_KEY, []);
    const index = all.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    const request = all[index];
    const store = vendorStores.create({
      vendorId: request.vendorId,
      name: request.name,
      description: request.description,
      logo: request.logo,
      banner: request.banner,
      address: request.address,
      phone: request.phone,
      email: request.email,
      category: request.category,
      isActive: true,
      isApproved: true,
      highlightTier: "standard",
      commissionRate: 5,
      totalOrderAmount: 0,
      totalBonusEarned: 0,
    });
    
    auth.update(request.vendorId, { isVendor: true, storeId: store.id });
    
    all[index] = {
      ...all[index],
      status: "approved",
      updatedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      processedBy: adminId,
    };
    saveToStorage(STORE_REQUESTS_KEY, all);
    
    notifications.create({
      userId: request.vendorId,
      title: "Mağaza təsdiqləndi!",
      message: `Təbriklər! "${request.name}" mağazanız təsdiqləndi və Marketplace-də görünür.`,
      type: "system",
    });
    
    return all[index];
  },
  
  reject(id: string, adminId: string, reason?: string): StoreRequest | null {
    const all = getFromStorage<StoreRequest[]>(STORE_REQUESTS_KEY, []);
    const index = all.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    all[index] = {
      ...all[index],
      status: "rejected",
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      processedBy: adminId,
    };
    saveToStorage(STORE_REQUESTS_KEY, all);
    
    notifications.create({
      userId: all[index].vendorId,
      title: "Mağaza rədd edildi",
      message: reason ? `Müraciətiniz rədd edildi. Səbəb: ${reason}` : "Müraciətiniz rədd edildi",
      type: "system",
    });
    
    return all[index];
  },
  
  delete(id: string): boolean {
    const all = getFromStorage<StoreRequest[]>(STORE_REQUESTS_KEY, []).filter(r => r.id !== id);
    const original = getFromStorage<StoreRequest[]>(STORE_REQUESTS_KEY, []);
    if (all.length === original.length) return false;
    saveToStorage(STORE_REQUESTS_KEY, all);
    return true;
  },
};

// --- Vendor Products ---
export const vendorProducts = {
  getAll(): VendorProduct[] {
    return getFromStorage<VendorProduct[]>(VENDOR_PRODUCTS_KEY, []).filter(p => p.isActive);
  },
  getById(id: string): VendorProduct | undefined {
    return getFromStorage<VendorProduct[]>(VENDOR_PRODUCTS_KEY, []).find(p => p.id === id);
  },
  getByStoreId(storeId: string): VendorProduct[] {
    return getFromStorage<VendorProduct[]>(VENDOR_PRODUCTS_KEY, []).filter(p => p.storeId === storeId && p.isActive);
  },
  getByVendorId(vendorId: string): VendorProduct[] {
    return getFromStorage<VendorProduct[]>(VENDOR_PRODUCTS_KEY, []).filter(p => p.vendorId === vendorId);
  },
  create(product: Omit<VendorProduct, "id" | "createdAt" | "updatedAt">): VendorProduct {
    const newProduct: VendorProduct = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const all = getFromStorage<VendorProduct[]>(VENDOR_PRODUCTS_KEY, []);
    all.push(newProduct);
    saveToStorage(VENDOR_PRODUCTS_KEY, all);
    return newProduct;
  },
  update(id: string, updates: Partial<VendorProduct>): VendorProduct | null {
    const all = getFromStorage<VendorProduct[]>(VENDOR_PRODUCTS_KEY, []);
    const index = all.findIndex(p => p.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
    saveToStorage(VENDOR_PRODUCTS_KEY, all);
    return all[index];
  },
  delete(id: string): boolean {
    const all = getFromStorage<VendorProduct[]>(VENDOR_PRODUCTS_KEY, []);
    const index = all.findIndex(p => p.id === id);
    if (index === -1) return false;
    all[index].isActive = false;
    saveToStorage(VENDOR_PRODUCTS_KEY, all);
    return true;
  },
};

// --- Vendor Orders ---
export const vendorOrders = {
  getAll(): VendorOrder[] {
    return getFromStorage<VendorOrder[]>(VENDOR_ORDERS_KEY, []);
  },
  getByVendorId(vendorId: string): VendorOrder[] {
    return getFromStorage<VendorOrder[]>(VENDOR_ORDERS_KEY, []).filter(o => o.vendorId === vendorId);
  },
  getByCustomerId(customerId: string): VendorOrder[] {
    return getFromStorage<VendorOrder[]>(VENDOR_ORDERS_KEY, []).filter(o => o.customerId === customerId);
  },
  create(order: Omit<VendorOrder, "id" | "createdAt" | "updatedAt">): VendorOrder {
    const newOrder: VendorOrder = {
      ...order,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const all = getFromStorage<VendorOrder[]>(VENDOR_ORDERS_KEY, []);
    all.push(newOrder);
    saveToStorage(VENDOR_ORDERS_KEY, all);
    return newOrder;
  },
  updateStatus(id: string, status: VendorOrder["status"]): VendorOrder | null {
    const all = getFromStorage<VendorOrder[]>(VENDOR_ORDERS_KEY, []);
    const index = all.findIndex(o => o.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], status, updatedAt: new Date().toISOString() };
    saveToStorage(VENDOR_ORDERS_KEY, all);
    return all[index];
  },
};

// --- Reviews ---
export const reviews = {
  getAll(): Review[] {
    return getFromStorage<Review[]>(REVIEWS_KEY, []);
  },
  getByStoreId(storeId: string): Review[] {
    return getFromStorage<Review[]>(REVIEWS_KEY, []).filter(r => r.storeId === storeId);
  },
  create(review: Omit<Review, "id" | "createdAt">): Review {
    const newReview: Review = {
      ...review,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const all = getFromStorage<Review[]>(REVIEWS_KEY, []);
    all.push(newReview);
    saveToStorage(REVIEWS_KEY, all);
    
    const storeReviews = this.getByStoreId(review.storeId);
    const avgRating = storeReviews.reduce((sum, r) => sum + r.rating, 0) / storeReviews.length;
    const store = vendorStores.getById(review.storeId);
    if (store) {
      vendorStores.update(store.id, { 
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: storeReviews.length 
      });
    }
    return newReview;
  },
};

// --- Withdrawals ---
export const vendorWithdrawals = {
  getAll(): VendorWithdrawal[] {
    return getFromStorage<VendorWithdrawal[]>(VENDOR_WITHDRAWALS_KEY, []);
  },
  getByVendorId(vendorId: string): VendorWithdrawal[] {
    return getFromStorage<VendorWithdrawal[]>(VENDOR_WITHDRAWALS_KEY, []).filter(w => w.vendorId === vendorId);
  },
  create(withdrawal: Omit<VendorWithdrawal, "id" | "requestedAt">): VendorWithdrawal {
    const newWithdrawal: VendorWithdrawal = {
      ...withdrawal,
      id: Date.now().toString(),
      requestedAt: new Date().toISOString(),
    };
    const all = getFromStorage<VendorWithdrawal[]>(VENDOR_WITHDRAWALS_KEY, []);
    all.push(newWithdrawal);
    saveToStorage(VENDOR_WITHDRAWALS_KEY, all);
    return newWithdrawal;
  },
  updateStatus(id: string, status: VendorWithdrawal["status"], notes?: string): VendorWithdrawal | null {
    const all = getFromStorage<VendorWithdrawal[]>(VENDOR_WITHDRAWALS_KEY, []);
    const index = all.findIndex(w => w.id === id);
    if (index === -1) return null;
    all[index] = { 
      ...all[index], 
      status, 
      ...(notes && { notes }),
      ...(status === "completed" || status === "rejected" ? { processedAt: new Date().toISOString() } : {})
    };
    saveToStorage(VENDOR_WITHDRAWALS_KEY, all);
    return all[index];
  },
};

export function calculateCommission(amount: number, rate: number = 0.05): { commission: number; vendorTotal: number } {
  const commission = amount * rate;
  return {
    commission: Math.round(commission * 100) / 100,
    vendorTotal: Math.round((amount - commission) * 100) / 100,
  };
}