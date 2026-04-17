// src/lib/authApi/storage.ts
// Гибридный слой: fetch с автоматическим фоллбэком на Mock DB

import { BASE_URL, getToken } from "./config";
import { products as mockProducts } from "../db/products";
import { orders as mockOrders } from "../db/orders";

export async function fetchWithFallback<T>(
  endpoint: string,
  options: RequestInit = {},
  mockGetter: () => T
): Promise<T> {
  try {
    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = `${BASE_URL}${endpoint}`;
    console.log(`[API Request] ${options.method || 'GET'} ${url}`);

    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    // ✅ ИСПРАВЛЕНО: объявление переменной data
    let data: any;
    
    if (isJson) {
      data = await res.clone().json();
    } else {
      const text = await res.clone().text();
      if (text.trim().startsWith("<")) throw new Error("HTML response");
      data = text ? JSON.parse(text) : {};
    }

    console.log(`[API Response] ${res.status} ${res.statusText}`);
    if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
    return data as T;
  } catch (error: any) {
    console.log(`[API Fallback] ${endpoint} → Mock DB`, error?.message);
    return mockGetter();
  }
}

export async function saveWithFallback<T>(
  endpoint: string,
  data: any,
  mockCreator: (data: any) => T,
  mockUpdater?: (id: string, data: any) => T
): Promise<T> {
  try {
    const token = getToken();
    const isUpdate = endpoint.includes('/:id') || data.id;
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: isUpdate ? "PUT" : "POST",
      headers: { 
        "Content-Type": "application/json", 
        ...(token ? { "Authorization": `Bearer ${token}` } : {}) 
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (error: any) {
    console.log(`[Save Fallback] ${endpoint} → Mock DB`, error?.message);
    if (mockUpdater && data.id) return mockUpdater(String(data.id), data);
    return mockCreator(data);
  }
}

export { mockProducts, mockOrders };