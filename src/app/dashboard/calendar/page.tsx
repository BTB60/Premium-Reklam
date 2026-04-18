"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { calendar, type CalendarEvent } from "@/lib/db";
import { authApi, orderApi, type UserData, type Order } from "@/lib/authApi";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { CalendarView } from "@/components/user/CalendarView";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    setEvents(calendar.getByUserId(String(currentUser.userId)));

    orderApi
      .getMyOrders()
      .then((data) => {
        setUserOrders(data.orders || []);
      })
      .catch((error) => {
        console.error("[Calendar] load orders error:", error);
        setUserOrders([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />

      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6"
          >
            <Link href="/dashboard">
              <Button variant="ghost" icon={<ArrowLeft className="w-5 h-5" />}>
                Geri
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-[#1F2937]">Təqvimim</h1>
          </motion.div>

          <CalendarView events={events} orders={userOrders as any} userId={String(user.userId)} />
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
