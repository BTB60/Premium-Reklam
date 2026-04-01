"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { referrals, type ReferralRecord, type User } from "@/lib/db";
import { Copy, Gift, Users, CheckCircle, Share2 } from "lucide-react";

interface ReferralProgramProps {
  user: User;
  referrals: ReferralRecord[];
}

export function ReferralProgram({ user, referrals: userReferrals }: ReferralProgramProps) {
  const [copied, setCopied] = useState(false);
  const stats = referrals.getStats(user.id);

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${user.referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: "Premium Reklam - Dostunu dəvət et",
      text: `Premium Reklam-a qoşul və ${stats.totalBonus} xal qazan! Mənim referral kodum: ${user.referralCode}`,
      url: referralLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-gray-500">Ümumi dəvət</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.completed}</p>
          <p className="text-xs text-gray-500">Tamamlanan</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-amber-600 text-lg">⏳</span>
          </div>
          <p className="text-2xl font-bold">{stats.pending}</p>
          <p className="text-xs text-gray-500">Gözləyən</p>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-[#D90429] to-[#EF476F] text-white">
          <Gift className="w-8 h-8 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.totalBonus}</p>
          <p className="text-xs text-white/80">Qazanılan xal</p>
        </Card>
      </div>

      {/* Referral Code */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-2">Sənin referral kodun</h3>
        <p className="text-gray-500 text-sm mb-4">
          Dostlarını dəvət et, hər biri qeydiyyatdan keçəndə 100 xal qazan!
        </p>

        <div className="flex gap-2">
          <div className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-mono text-lg">
            {user.referralCode}
          </div>
          <Button onClick={handleCopy} icon={<Copy className="w-4 h-4" />}>
            {copied ? "Kopyalandı!" : "Kopyala"}
          </Button>
          <Button variant="ghost" onClick={handleShare} icon={<Share2 className="w-4 h-4" />}>
            Paylaş
          </Button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Referral linkin:</strong>
            <br />
            <span className="text-xs break-all">{referralLink}</span>
          </p>
        </div>
      </Card>

      {/* Referrals List */}
      <Card className="p-6">
        <h3 className="font-bold mb-4">Dəvət etdiklərin</h3>
        {userReferrals.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Hələ heç kəsi dəvət etməmisən. Dostlarını dəvət et və bonus qazan!
          </p>
        ) : (
          <div className="space-y-2">
            {userReferrals.map((ref) => (
              <div
                key={ref.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      ref.status === "completed"
                        ? "bg-emerald-100"
                        : "bg-amber-100"
                    }`}
                  >
                    {ref.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <span className="text-amber-600">⏳</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{ref.referredName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(ref.createdAt).toLocaleDateString("az-AZ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      ref.status === "completed"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {ref.status === "completed" ? "Tamamlandı" : "Gözləyir"}
                  </span>
                  {ref.status === "completed" && (
                    <p className="text-sm text-emerald-600 font-bold mt-1">
                      +{ref.bonusPoints} xal
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
