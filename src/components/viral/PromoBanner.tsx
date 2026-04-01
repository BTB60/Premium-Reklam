"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Clock, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PromoCampaign {
  id: string;
  type: "first_order" | "referral" | "limited_time" | "seasonal";
  title: string;
  description: string;
  cta: string;
  badge?: string;
  expiresAt?: Date;
  color: string;
}

const campaigns: PromoCampaign[] = [
  {
    id: "1",
    type: "first_order",
    title: "İlk Sifarişinə 10% Endirim",
    description: "İndi qeydiyyatdan keç, ilk sifarişində 10% endirim qazan",
    cta: "İstifadə Et",
    badge: "YENİ",
    color: "from-[#D90429] to-[#EF476F]",
  },
  {
    id: "2",
    type: "referral",
    title: "Dostunu Gətir, 25 AZN Bonus Qazan",
    description: "Hər dəvət etdiyin dost üçün 25 AZN bonus",
    cta: "Dəvət Et",
    badge: "POPULYAR",
    color: "from-[#16A34A] to-[#22C55E]",
  },
  {
    id: "3",
    type: "limited_time",
    title: "Pro Paket 1 Ay Pulsuz",
    description: "İlk 100 dekorçuya xüsusi təklif. Vaxt tükənir!",
    cta: "İndi Al",
    badge: "MƏHDUD",
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    color: "from-[#F59E0B] to-[#FBBF24]",
  },
];

function CountdownTimer({ expiresAt }: { expiresAt: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = expiresAt.getTime() - Date.now();
      
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="w-4 h-4" />
      <span className="font-mono">
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}

export function PromoBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  const currentCampaign = campaigns[currentIndex];

  useEffect(() => {
    if (campaigns.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 8000); // Rotate every 8 seconds

    return () => clearInterval(interval);
  }, []);

  if (isDismissed || !isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentCampaign.id}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`relative bg-gradient-to-r ${currentCampaign.color} text-white overflow-hidden`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Content */}
            <div className="flex items-center gap-4 flex-1">
              {/* Badge */}
              {currentCampaign.badge && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded text-xs font-bold">
                  <Star className="w-3 h-3" />
                  {currentCampaign.badge}
                </span>
              )}

              {/* Text */}
              <div className="flex items-center gap-3 flex-wrap">
                <Gift className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">
                  {currentCampaign.title}
                </span>
                <span className="hidden md:inline text-white/80 text-sm">
                  {currentCampaign.description}
                </span>
              </div>

              {/* Countdown */}
              {currentCampaign.expiresAt && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-white/20 rounded-lg">
                  <CountdownTimer expiresAt={currentCampaign.expiresAt} />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white text-gray-900 hover:bg-gray-100 border-none text-xs"
              >
                {currentCampaign.cta}
              </Button>
              
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 8, ease: "linear" }}
              key={currentCampaign.id}
              className="h-full bg-white/50"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Floating Action Button for Mobile
export function FloatingPromoButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 z-40 md:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 w-64 bg-white rounded-2xl shadow-2xl p-4 mb-2"
          >
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`p-3 rounded-xl bg-gradient-to-r ${campaign.color} text-white`}
                >
                  <p className="font-bold text-sm">{campaign.title}</p>
                  <p className="text-xs text-white/80 mt-1">{campaign.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-[#D90429] to-[#EF476F] text-white shadow-lg flex items-center justify-center"
      >
        <Gift className={`w-6 h-6 transition-transform ${isOpen ? "rotate-45" : ""}`} />
      </motion.button>
    </div>
  );
}

// Achievement Badge for Viral Growth
export function AchievementBadge({ 
  type, 
  title, 
  description 
}: { 
  type: "new" | "popular" | "limited" | "exclusive";
  title: string;
  description: string;
}) {
  const styles = {
    new: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20",
    popular: "bg-[#D90429]/10 text-[#D90429] border-[#D90429]/20",
    limited: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
    exclusive: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20",
  };

  const icons = {
    new: <Star className="w-4 h-4" />,
    popular: <Users className="w-4 h-4" />,
    limited: <Clock className="w-4 h-4" />,
    exclusive: <Gift className="w-4 h-4" />,
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${styles[type]}`}>
      {icons[type]}
      <span className="text-sm font-medium">{title}</span>
    </div>
  );
}
