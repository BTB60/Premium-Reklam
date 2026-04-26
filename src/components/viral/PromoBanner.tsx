"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Clock, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useHomePromoCampaigns } from "@/lib/useHomePromoCampaigns";

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
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="w-4 h-4" />
      <span className="font-mono" suppressHydrationWarning>
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}

export function PromoBanner() {
  const campaigns = useHomePromoCampaigns();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  const currentCampaign = campaigns[currentIndex] ?? campaigns[0];

  useEffect(() => {
    if (campaigns.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [campaigns.length]);

  useEffect(() => {
    setCurrentIndex((i) => (campaigns.length ? Math.min(i, campaigns.length - 1) : 0));
  }, [campaigns.length]);

  if (isDismissed || !currentCampaign) return null;

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
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            {/* Məzmun sətri */}
            <div className="flex flex-wrap items-start gap-2 sm:gap-3 flex-1 min-w-0">
              {currentCampaign.badge && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 bg-white/20 rounded text-[10px] sm:text-xs font-bold shrink-0">
                  <Star className="w-3 h-3" />
                  {currentCampaign.badge}
                </span>
              )}
              <div className="flex items-start gap-2 min-w-0 flex-1 basis-[min(100%,14rem)] sm:basis-auto">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-xs sm:text-base leading-snug block">{currentCampaign.title}</span>
                  <span className="text-white/80 text-[11px] sm:text-sm mt-0.5 line-clamp-2 sm:line-clamp-none block md:hidden">
                    {currentCampaign.description}
                  </span>
                  <span className="hidden md:inline text-white/80 text-sm mt-1">{currentCampaign.description}</span>
                </div>
              </div>
              {currentCampaign.expiresAt && (
                <div className="flex items-center gap-2 px-2 py-1 sm:px-3 bg-white/20 rounded-lg shrink-0 w-full justify-center sm:w-auto sm:justify-start">
                  <CountdownTimer expiresAt={currentCampaign.expiresAt} />
                </div>
              )}
            </div>

            {/* Düymələr */}
            <div className="flex items-center justify-end gap-2 flex-shrink-0 w-full sm:w-auto pt-0.5 sm:pt-0 border-t border-white/10 sm:border-0">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white text-gray-900 hover:bg-gray-100 border-none text-xs min-h-[40px] sm:min-h-0 flex-1 sm:flex-initial max-w-[200px] sm:max-w-none"
              >
                {currentCampaign.cta}
              </Button>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors shrink-0"
                aria-label="Banneri bağla"
              >
                <X className="w-5 h-5" />
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
  const campaigns = useHomePromoCampaigns();

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
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-[#D90429] to-[#EF476F] text-white shadow-lg flex items-center justify-center"
        aria-expanded={isOpen}
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
  description,
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
