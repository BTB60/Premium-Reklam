"use client";

import { useState, useEffect, useCallback } from "react";
import { playPremiumNotificationSound } from "@/lib/notificationSound";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
}

interface UseRealtimeNotificationsOptions {
  pollInterval?: number; // milliseconds
  onNewOrder?: (order: any) => void;
}

export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const { pollInterval = 30000, onNewOrder } = options; // Default 30 seconds
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play notification sound
  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    playPremiumNotificationSound();
  }, [soundEnabled]);

  // Check for new orders/notifications
  const checkNotifications = useCallback(async () => {
    try {
      // In a real app, this would call the backend
      // For now, we'll simulate it
      const lastCheck = localStorage.getItem("lastNotificationCheck");
      const now = new Date();
      
      if (!lastCheck || new Date(lastCheck).getTime() < now.getTime() - pollInterval) {
        localStorage.setItem("lastNotificationCheck", now.toISOString());
        
        // Check for pending orders
        const pendingOrders = localStorage.getItem("decor_orders");
        if (pendingOrders) {
          const orders = JSON.parse(pendingOrders);
          const pending = orders.filter((o: any) => 
            o.status === "pending" || o.status === "PENDING"
          );
          
          if (pending.length > 0) {
            const hasPending = notifications.some(n => n.type === "warning" && n.title === "Yeni Sifarişlər");
            
            if (!hasPending) {
              playSound();
              
              setNotifications(prev => [{
                id: now.toISOString(),
                title: "Yeni Sifarişlər",
                message: `${pending.length} sifariş gözləyir`,
                type: "warning",
                timestamp: now,
              }, ...prev]);
              
              setHasNew(true);
              
              if (onNewOrder) {
                onNewOrder(pending);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  }, [pollInterval, notifications, playSound, onNewOrder]);

  // Initial check and polling
  useEffect(() => {
    checkNotifications();
    
    const interval = setInterval(checkNotifications, pollInterval);
    return () => clearInterval(interval);
  }, [checkNotifications, pollInterval]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notifications.length === 1) {
      setHasNew(false);
    }
  }, [notifications.length]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setHasNew(false);
  }, []);

  return {
    notifications,
    hasNew,
    soundEnabled,
    setSoundEnabled,
    markAsRead,
    clearAll,
    playSound,
  };
}

// Simple notification toast component
export function NotificationToast({ 
  notification, 
  onClose 
}: { 
  notification: NotificationItem; 
  onClose: () => void; 
}) {
  const colors = {
    info: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${colors[notification.type]} text-white px-6 py-4 rounded-lg shadow-2xl animate-slide-in`}>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="font-bold">{notification.title}</p>
          <p className="text-sm opacity-90">{notification.message}</p>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded"
        >
          ×
        </button>
      </div>
    </div>
  );
}
