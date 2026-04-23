"use client";

import { useEffect } from "react";
import { playPremiumNotificationSound } from "@/lib/notificationSound";

interface OrderNotificationProps {
  newOrderCount: number;
  onClear?: () => void;
}

export function OrderNotification({ newOrderCount, onClear }: OrderNotificationProps) {
  useEffect(() => {
    if (newOrderCount > 0) {
      playPremiumNotificationSound();
      
      // Show browser notification if permitted
      if (Notification.permission === "granted") {
        new Notification("Yeni Sifariş!", {
          body: `${newOrderCount} yeni sifariş gəldi!`,
          icon: "/icon.svg",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, [newOrderCount]);

  if (newOrderCount === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-pulse">
      <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4">
        <div className="relative">
          <Bell className="w-8 h-8" />
          <span className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">
            {newOrderCount}
          </span>
        </div>
        <div>
          <p className="font-bold">Yeni Sifariş!</p>
          <p className="text-sm opacity-90">{newOrderCount} sifariş gözləyir</p>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="ml-4 p-2 hover:bg-red-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// Simple Bell icon component
function Bell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

// Simple X icon component
function X({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
