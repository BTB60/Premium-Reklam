// src/lib/db/storage.ts
// Универсальные утилиты localStorage с кросс-таб синхронизацией

/**
 * Чтение из localStorage с безопасным парсингом
 */
export function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[storage] Failed to parse JSON for key "${key}", returning fallback`);
    return fallback;
  }
}

/**
 * Диспетчеризация событий для синхронизации между вкладками и внутри одной вкладки
 */
export function dispatchStorageEvent<T>(key: string, value?: T): void {
  if (typeof window === "undefined") return;
  
  // Браузерное событие для ДРУГИХ вкладок (может не работать для same-tab)
  try {
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: JSON.stringify(value) }));
  } catch (e) {
    // Игнорируем, если браузер не поддерживает ручной диспатч StorageEvent
  }
  
  // ✅ Кастомное событие для ТЕКУЩЕЙ вкладки — ОСНОВНОЙ механизм
  // Передаём объект { key, value } для гибкой фильтрации
  window.dispatchEvent(new CustomEvent(`storage:${key}`, { detail: { key, value } }));
  console.log(`[storage] Dispatched custom event: storage:${key}`);
}

/**
 * Запись в localStorage с автоматической синхронизацией
 */
export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
    console.log(`[storage] Saved to ${key}, bytes: ${JSON.stringify(value).length}`);
    dispatchStorageEvent(key, value);
  } catch (error) {
    console.error(`[storage] Failed to save key "${key}":`, error);
  }
}

/**
 * Удаление ключа с уведомлением слушателей
 */
export function removeFromStorage(key: string): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(key);
    console.log(`[storage] Removed key: ${key}`);
    dispatchStorageEvent(key, null);
  } catch (error) {
    console.error(`[storage] Failed to remove key "${key}":`, error);
  }
}

console.log("[storage.ts] Module loaded, exports: getFromStorage, saveToStorage, removeFromStorage, dispatchStorageEvent");