/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-rest-params */
"use client";

import { useEffect } from "react";

// Google Analytics Configuration
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXXXX";

// Facebook Pixel Configuration
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "000000000000000";

// Google Analytics Component
export function GoogleAnalytics() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load gtag script
    const existingScript = window.document.getElementById("ga-script");
    if (existingScript) return;

    const script = window.document.createElement("script");
    script.id = "ga-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    window.document.head.appendChild(script);

    // Initialize gtag
    const win = window as any;
    win.dataLayer = win.dataLayer || [];
    function gtag(...args: any[]) {
      win.dataLayer.push(args);
    }
    win.gtag = gtag;
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID, {
      page_path: window.location.pathname,
    });

    return () => {
      if (window.document.getElementById("ga-script")) {
        window.document.head.removeChild(script);
      }
    };
  }, []);

  return null;
}

// Facebook Pixel Component
export function FacebookPixel() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const win = window as any;

    // No real pixel id in env — avoid loading a duplicate / placeholder bootstrap
    if (!FB_PIXEL_ID || FB_PIXEL_ID === "000000000000000") return;

    // GTM or another tag may already load fbevents.js; a second copy triggers Meta "conflicting versions"
    const fbeventsAlready =
      !!document.querySelector('script[src*="fbevents.js"]') ||
      !!document.getElementById("fb-pixel-script");
    if (fbeventsAlready || win.fbq) return;

    // Initialize fbq
    win.fbq = function fbqHandler(...args: any[]) {
      win.fbq.q = win.fbq.q || [];
      win.fbq.q.push(args);
    };
    win.fbq.q = [];
    win.fbq.loaded = true;

    win.fbq("init", FB_PIXEL_ID);
    win.fbq("track", "PageView");

    // Load pixel script
    const script = window.document.createElement("script");
    script.id = "fb-pixel-script";
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    window.document.head.appendChild(script);
  }, []);

  return null;
}

// Analytics Helper Functions
export const analytics = {
  // Page View
  pageView(url: string) {
    if (typeof window === "undefined") return;
    
    // Google Analytics
    (window as any).gtag?.("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });

    // Facebook Pixel
    (window as any).fbq?.("track", "PageView", { url });
  },

  // Product View
  productView(product: { id: string; name: string; price: number; category?: string }) {
    if (typeof window === "undefined") return;

    // Google Analytics
    (window as any).gtag?.("event", "view_item", {
      currency: "AZN",
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category || "General",
        price: product.price,
      }],
    });

    // Facebook Pixel
    (window as any).fbq?.("track", "ViewContent", {
      content_ids: [product.id],
      content_type: "product",
      value: product.price,
      currency: "AZN",
    });
  },

  // Add to Cart
  addToCart(product: { id: string; name: string; price: number }, quantity: number = 1) {
    if (typeof window === "undefined") return;

    // Google Analytics
    (window as any).gtag?.("event", "add_to_cart", {
      currency: "AZN",
      value: product.price * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity,
      }],
    });

    // Facebook Pixel
    (window as any).fbq?.("track", "AddToCart", {
      content_ids: [product.id],
      content_type: "product",
      value: product.price * quantity,
      currency: "AZN",
    });
  },

  // Remove from Cart
  removeFromCart(productId: string) {
    if (typeof window === "undefined") return;

    // Google Analytics
    (window as any).gtag?.("event", "remove_from_cart", {
      items: [{ item_id: productId }],
    });

    // Facebook Pixel
    (window as any).fbq?.("track", "RemoveFromCart", {
      content_ids: [productId],
      content_type: "product",
    });
  },

  // Begin Checkout
  beginCheckout(cart: { id: string; price: number }[]) {
    if (typeof window === "undefined") return;

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const ids = cart.map((item) => item.id);

    // Google Analytics
    (window as any).gtag?.("event", "begin_checkout", {
      currency: "AZN",
      value: total,
      items: cart.map((item) => ({ item_id: item.id })),
    });

    // Facebook Pixel
    (window as any).fbq?.("track", "InitiateCheckout", {
      content_ids: ids,
      content_type: "product",
      value: total,
      currency: "AZN",
    });
  },

  // Purchase
  purchase(order: { id: string; total: number; items: { id: string; price: number }[] }) {
    if (typeof window === "undefined") return;

    const ids = order.items.map((item) => item.id);

    // Google Analytics
    (window as any).gtag?.("event", "purchase", {
      transaction_id: order.id,
      currency: "AZN",
      value: order.total,
      items: order.items.map((item) => ({ item_id: item.id, price: item.price })),
    });

    // Facebook Pixel
    (window as any).fbq?.("track", "Purchase", {
      content_ids: ids,
      content_type: "product",
      value: order.total,
      currency: "AZN",
    });
  },

  // Sign Up
  signUp(method: "email" | "phone" | "google" | "facebook") {
    if (typeof window === "undefined") return;

    // Google Analytics
    (window as any).gtag?.("event", "sign_up", {
      method,
    });

    // Facebook Pixel
    (window as any).fbq?.("track", "Lead", {
      content_name: "Sign Up",
      content_category: method,
    });
  },

  // Search
  search(query: string) {
    if (typeof window === "undefined") return;

    // Google Analytics
    (window as any).gtag?.("event", "search", {
      search_term: query,
    });

    // Facebook Pixel
    (window as any).fbq?.("track", "Search", {
      search_string: query,
    });
  },

  // Custom Event
  event(name: string, params?: Record<string, any>) {
    if (typeof window === "undefined") return;
    (window as any).gtag?.("event", name, params);
    (window as any).fbq?.("trackCustom", name, params);
  },
};

// Hook for tracking page views
export function usePageTracking() {
  useEffect(() => {
    analytics.pageView(window.location.pathname);
  }, []);
}
