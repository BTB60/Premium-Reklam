import { Product } from "./types";
import { fetchWithFallback, saveWithFallback, mockProducts } from "./storage";

const normalizeProduct = (p: any): Product => ({
  ...p, id: String(p.id),
  salePrice: p.salePrice ?? p.basePrice ?? p.unitPrice ?? 0,
  basePrice: p.basePrice ?? p.salePrice ?? 0,
  isActive: p.isActive ?? (p.status !== "INACTIVE"),
  status: p.status ?? (p.isActive === false ? "INACTIVE" : "ACTIVE"),
});

export const productApi = {
  getAll: () => fetchWithFallback('/products', {}, () => mockProducts.getActive().map(normalizeProduct)),
  getById: (id: string | number) => fetchWithFallback(`/products/${id}`, {}, () => {
    const p = mockProducts.getById(String(id));
    return p ? normalizeProduct(p) : null;
  }),
  getCategories: () => fetchWithFallback('/products/categories', {}, () => mockProducts.getCategories().map((c: any) => c.name)),

  async create(product: Partial<Product>): Promise<Product> {
    return saveWithFallback('/products', { ...product, isActive: product.isActive ?? true, status: product.status ?? "ACTIVE" }, (data) => {
      return normalizeProduct(mockProducts.create({ ...data, id: undefined, createdAt: undefined, updatedAt: undefined }));
    });
  },

  async update(id: string | number, product: Partial<Product>): Promise<Product> {
    return saveWithFallback(`/products/${id}`, product, () => { throw new Error("Update fallback error"); }, (pid, data) => {
      const updated = mockProducts.update(pid, data);
      if (!updated) throw new Error("Product not found");
      return normalizeProduct(updated);
    });
  },

  async delete(id: string | number) {
    try { await fetchWithFallback(`/products/${id}`, { method: "DELETE" }, () => {}); }
    catch { mockProducts.delete(String(id)); }
  },

  getUserPrice: () => Promise.resolve(0),
  setUserPrice: () => Promise.resolve({} as any),
  getUserPrices: () => Promise.resolve([]),
  deleteUserPrice: () => Promise.resolve(),
};