"use client";

import { Shield, Plus, Key } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AccessSettingsHeader({
  lang,
  onToggleLang,
  onToggleForm,
}: {
  lang: "az" | "en";
  onToggleLang: () => void;
  onToggleForm: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-[#D90429]" />
        <h1 className="text-2xl font-bold text-[#1F2937]">Giriş Ayarları</h1>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onToggleLang} icon={<Key className="w-4 h-4" />}>
          {lang.toUpperCase()}
        </Button>
        <Button onClick={onToggleForm} icon={<Plus className="w-4 h-4" />}>
          Yeni Subadmin
        </Button>
      </div>
    </div>
  );
}
