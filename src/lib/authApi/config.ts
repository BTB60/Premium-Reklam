// src/lib/authApi/config.ts
// Конфигурация гибридного API-слоя (Production Ready)

// ✅ Базовый URL бэкенда с нормализацией
// 1. Берем из env
// 2. Убираем trailing slash
// 3. Добавляем /api если нет
// 4. Фоллбэк на localhost для dev
const getBaseUrl = (): string => {
  if (typeof window === "undefined") {
    // SSR: используем env или дефолт
    const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return url.endsWith("/api") ? url : `${url}/api`;
  }
  
  // Client: используем env или дефолт
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  return url.endsWith("/api") ? url : `${url}/api`;
};

export const BASE_URL = getBaseUrl();

// ✅ Маппинг ролей (бэкенд → фронтенд)
export function mapRole(role: string): "ADMIN" | "DECORATOR" | "VENDOR" | "REKLAMCI" | "SUBADMIN" {
  const r = role?.toUpperCase();
  if (r === "ADMIN" || r === "SUPERADMIN") return "ADMIN";
  if (r === "VENDOR" || r === "SELLER") return "VENDOR";
  if (r === "REKLAMCI") return "REKLAMCI";
  if (r === "SUBADMIN") return "SUBADMIN";
  return "DECORATOR";
}

// ✅ Работа с текущей сессией (localStorage)
const SESSION_KEY = "decor_current_user";

export function getCurrentUser(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCurrentUser(user: any): void {
  if (typeof window === "undefined") return;
  // ✅ Убираем пароль перед сохранением в сессию
  const { password: _, ...safeUser } = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
  
  // ✅ Диспетчеризация события для кросс-таб синхронизации
  try {
    window.dispatchEvent(new StorageEvent("storage", { key: SESSION_KEY }));
    window.dispatchEvent(new CustomEvent(`storage:${SESSION_KEY}`));
  } catch {}
}

export function logoutUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  try {
    window.dispatchEvent(new StorageEvent("storage", { key: SESSION_KEY }));
  } catch {}
}

// ✅ Токен аутентификации (для будущих запросов с Authorization header)
export function getAuthToken(): string | null {
  const user = getCurrentUser();
  return user?.token || null;
}

// ✅ АЛИАС ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
export const getToken = getAuthToken;

export function setAuthToken(token: string): void {
  const user = getCurrentUser();
  if (user) {
    saveCurrentUser({ ...user, token });
  }
}