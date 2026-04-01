"use client";

import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Copy, 
  Share2, 
  Users, 
  Gift, 
  TrendingUp,
  CheckCircle,
  MessageCircle,
  Link as LinkIcon,
  Facebook,
  Twitter
} from "lucide-react";

interface ReferralStats {
  totalReferrals: number;
  registered: number;
  firstOrders: number;
  totalEarned: number;
  pendingBonus: number;
}

interface ReferralUser {
  id: string;
  name: string;
  avatar: string;
  status: "registered" | "first_order" | "completed";
  joinedAt: string;
  earned: number;
}

const shareMessages = {
  whatsapp: "Premium Reklam sistemində qeydiyyatdan keç, sifarişlərini daha rahat idarə et, ilk sifarişində 10% endirim qazan! 🚀\n\nLink: {link}",
  telegram: "🎯 Premium Reklam - Reklam və dekor xidmətləri\n\n✅ Sifarişləri asan idarə et\n✅ Borcu nəzarətdə saxla\n✅ Bonuslar qazan\n\nİlk sifarişinə 10% endirim:\n{link}",
  default: "Premium Reklam - Professional reklam və dekor xidmətləri. İlk sifarişində 10% endirim qazan! {link}"
};

export function ReferralSystem() {
  const [copied, setCopied] = useState(false);
  
  // Mock data - would come from API
  const referralCode = "DECOR2024";
  const referralLink = `https://decorapp.az/ref/${referralCode}`;
  
  const stats: ReferralStats = {
    totalReferrals: 12,
    registered: 8,
    firstOrders: 5,
    totalEarned: 250,
    pendingBonus: 75,
  };

  const referrals: ReferralUser[] = [
    { id: "1", name: "Əli Vəliyev", avatar: "Ə", status: "completed", joinedAt: "2 gün əvvəl", earned: 50 },
    { id: "2", name: "Aygün Məmmədova", avatar: "A", status: "first_order", joinedAt: "5 gün əvvəl", earned: 25 },
    { id: "3", name: "Rəşid Əliyev", avatar: "R", status: "registered", joinedAt: "1 həftə əvvəl", earned: 0 },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: "whatsapp" | "telegram" | "facebook" | "twitter") => {
    const message = shareMessages[platform === "facebook" || platform === "twitter" ? "default" : platform];
    const text = message.replace("{link}", referralLink);
    
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    };

    window.open(urls[platform], "_blank", "width=600,height=400");
  };

  const getStatusColor = (status: ReferralUser["status"]) => {
    switch (status) {
      case "completed": return "bg-[#16A34A]/10 text-[#16A34A]";
      case "first_order": return "bg-[#3B82F6]/10 text-[#3B82F6]";
      case "registered": return "bg-[#F59E0B]/10 text-[#F59E0B]";
    }
  };

  const getStatusLabel = (status: ReferralUser["status"]) => {
    switch (status) {
      case "completed": return "Tamamladı";
      case "first_order": return "İlk sifariş";
      case "registered": return "Qeydiyyatdan keçdi";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ümumi Dəvət"
          value={stats.totalReferrals}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Qeydiyyatdan Keçən"
          value={stats.registered}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatCard
          title="İlk Sifariş"
          value={stats.firstOrders}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Qazancın"
          value={`${stats.totalEarned} AZN`}
          change={`+${stats.pendingBonus} gözləyir`}
          changeType="positive"
          icon={<Gift className="w-5 h-5" />}
        />
      </div>

      {/* Referral Link Card */}
      <Card className="bg-gradient-to-br from-[#D90429] to-[#EF476F] text-white border-none">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold font-[Manrope] mb-2">
            Dostlarını Dəvət Et, Bonus Qazan!
          </h3>
          <p className="text-white/80 text-sm">
            Hər dəvət etdiyin dost üçün 25 AZN bonus qazan
          </p>
        </div>

        {/* Referral Code */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
          <p className="text-white/60 text-xs mb-1">Sənin referral kodun</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold tracking-wider">{referralCode}</span>
            <button
              onClick={handleCopy}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => handleShare("whatsapp")}
            className="flex flex-col items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs">WhatsApp</span>
          </button>
          <button
            onClick={() => handleShare("telegram")}
            className="flex flex-col items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <Share2 className="w-6 h-6" />
            <span className="text-xs">Telegram</span>
          </button>
          <button
            onClick={() => handleShare("facebook")}
            className="flex flex-col items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <Facebook className="w-6 h-6" />
            <span className="text-xs">Facebook</span>
          </button>
          <button
            onClick={() => handleShare("twitter")}
            className="flex flex-col items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <Twitter className="w-6 h-6" />
            <span className="text-xs">Twitter</span>
          </button>
        </div>
      </Card>

      {/* How it Works */}
      <Card>
        <h3 className="font-bold text-[#1F2937] font-[Manrope] mb-4">
          Necə İşləyir?
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#D90429] text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <p className="font-medium text-[#1F2937]">Linki Paylaş</p>
              <p className="text-sm text-[#6B7280]">Dostlarınla referral linkini paylaş</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#D90429] text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <p className="font-medium text-[#1F2937]">Qeydiyyatdan Keçsin</p>
              <p className="text-sm text-[#6B7280]">Dostun linkə klikləyib qeydiyyatdan keçir</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#D90429] text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <p className="font-medium text-[#1F2937]">Bonus Qazan</p>
              <p className="text-sm text-[#6B7280]">Dostun ilk sifariş verdikdə 25 AZN bonus qazan</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Referred Users List */}
      <Card>
        <h3 className="font-bold text-[#1F2937] font-[Manrope] mb-4">
          Dəvət Etdiklərin
        </h3>
        <div className="space-y-3">
          {referrals.map((referral) => (
            <motion.div
              key={referral.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D90429]/10 flex items-center justify-center text-[#D90429] font-bold">
                  {referral.avatar}
                </div>
                <div>
                  <p className="font-medium text-[#1F2937]">{referral.name}</p>
                  <p className="text-xs text-[#6B7280]">{referral.joinedAt}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(referral.status)}`}>
                  {getStatusLabel(referral.status)}
                </span>
                {referral.earned > 0 && (
                  <p className="text-sm font-medium text-[#16A34A] mt-1">+{referral.earned} AZN</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
