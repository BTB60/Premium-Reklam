"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Language = "az" | "en" | "ru";

interface Translations {
  [key: string]: {
    az: string;
    en: string;
    ru: string;
  };
}

const translations: Translations = {
  // Navigation
  "nav.home": { az: "Ana Səhifə", en: "Home", ru: "Главная" },
  "nav.marketplace": { az: "Marketplace", en: "Marketplace", ru: "Маркетплейс" },
  "nav.services": { az: "Xidmətlər", en: "Services", ru: "Услуги" },
  "nav.howItWorks": { az: "Necə işləyir", en: "How it works", ru: "Как это работает" },
  "nav.pricing": { az: "Qiymət", en: "Pricing", ru: "Цены" },
  "nav.contact": { az: "Əlaqə", en: "Contact", ru: "Контакты" },
  "nav.login": { az: "Daxil ol", en: "Login", ru: "Войти" },
  "nav.register": { az: "Qeydiyyat", en: "Register", ru: "Регистрация" },
  "nav.orders": { az: "Sifarişlər", en: "Orders", ru: "Заказы" },
  "nav.notifications": { az: "Bildirişlər", en: "Notifications", ru: "Уведомления" },
  "nav.support": { az: "Dəstək", en: "Support", ru: "Поддержка" },
  "nav.settings": { az: "Ayarlar", en: "Settings", ru: "Настройки" },
  "nav.logout": { az: "Çıxış", en: "Logout", ru: "Выйти" },
  
  // Common
  "common.save": { az: "Saxla", en: "Save", ru: "Сохранить" },
  "common.cancel": { az: "Ləğv et", en: "Cancel", ru: "Отмена" },
  "common.delete": { az: "Sil", en: "Delete", ru: "Удалить" },
  "common.edit": { az: "Redaktə et", en: "Edit", ru: "Редактировать" },
  "common.add": { az: "Əlavə et", en: "Add", ru: "Добавить" },
  "common.search": { az: "Axtar", en: "Search", ru: "Поиск" },
  "common.loading": { az: "Yüklənir...", en: "Loading...", ru: "Загрузка..." },
  "common.noResults": { az: "Nəticə tapılmadı", en: "No results found", ru: "Результатов не найдено" },
  
  // Products
  "product.addToCart": { az: "Səbətə əlavə et", en: "Add to cart", ru: "В корзину" },
  "product.buyNow": { az: "İndi al", en: "Buy now", ru: "Купить сейчас" },
  "product.price": { az: "Qiymət", en: "Price", ru: "Цена" },
  "product.sale": { az: "Endirim", en: "Sale", ru: "Скидка" },
  "product.outOfStock": { az: "Stokda yoxdur", en: "Out of stock", ru: "Нет в наличии" },
  "product.inStock": { az: "Stokda var", en: "In stock", ru: "В наличии" },
  
  // Orders
  "order.new": { az: "Yeni sifariş", en: "New order", ru: "Новый заказ" },
  "order.history": { az: "Sifariş tarixçəsi", en: "Order history", ru: "История заказов" },
  "order.status.pending": { az: "Gözləyir", en: "Pending", ru: "Ожидает" },
  "order.status.processing": { az: "İşlənir", en: "Processing", ru: "В обработке" },
  "order.status.shipped": { az: "Göndərildi", en: "Shipped", ru: "Отправлен" },
  "order.status.delivered": { az: "Çatdırıldı", en: "Delivered", ru: "Доставлен" },
  "order.status.cancelled": { az: "Ləğv edildi", en: "Cancelled", ru: "Отменен" },
  
  // Notifications
  "notification.new": { az: "Yeni bildiriş", en: "New notification", ru: "Новое уведомление" },
  "notification.all": { az: "Hamısı", en: "All", ru: "Все" },
  "notification.markRead": { az: "Oxundu kimi işarələ", en: "Mark as read", ru: "Отметить прочитанным" },
  
  // Support
  "support.title": { az: "Dəstək Mərkəzi", en: "Support Center", ru: "Центр поддержки" },
  "support.chat": { az: "Çat", en: "Chat", ru: "Чат" },
  "support.email": { az: "Email", en: "Email", ru: "Email" },
  "support.phone": { az: "Telefon", en: "Phone", ru: "Телефон" },
  
  // Dark Mode
  "theme.dark": { az: "Qaranlıq", en: "Dark", ru: "Тёмный" },
  "theme.light": { az: "İşıqlı", en: "Light", ru: "Светлый" },
  "theme.toggle": { az: "Tema dəyiş", en: "Toggle theme", ru: "Сменить тему" },
  
  // Loyalty
  "loyalty.points": { az: "Xallar", en: "Points", ru: "Баллы" },
  "loyalty.balance": { az: "Balans", en: "Balance", ru: "Баланс" },
  "loyalty.earn": { az: "Qazan", en: "Earn", ru: "Заработать" },
  "loyalty.spend": { az: "Xərclə", en: "Spend", ru: "Потратить" },
  
  // Flash Sale
  "flashSale.title": { az: "Flaş Endirim", en: "Flash Sale", ru: "Мгновенная распродажа" },
  "flashSale.endsIn": { az: "Bitir", en: "Ends in", ru: "Заканчивается через" },
  "flashSale.shopNow": { az: "İndi al", en: "Shop now", ru: "Купить сейчас" },
  
  // Referral
  "referral.title": { az: "Dost dəvət et", en: "Invite friends", ru: "Пригласить друзей" },
  "referral.code": { az: "Dəvət kodu", en: "Referral code", ru: "Реферальный код" },
  "referral.share": { az: "Paylaş", en: "Share", ru: "Поделиться" },
  "referral.earn": { az: "Qazan", en: "Earn", ru: "Заработать" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("az");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("language") as Language;
    if (saved && ["az", "en", "ru"].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    if (!mounted) return key;
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  // Return default language if not mounted yet (SSR/hydration)
  if (!context) {
    return {
      language: "az" as const,
      setLanguage: () => {},
      t: (key: string) => key
    };
  }
  return context;
}
