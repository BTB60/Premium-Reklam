"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_PROMO_CAMPAIGNS_STORED,
  PROMO_COLOR_PRESETS,
  loadHomePromoBannerFromRemote,
  resetHomePromoCampaigns,
  saveHomePromoBannerRemote,
  type PromoCampaignStored,
  type PromoCampaignType,
} from "@/lib/homePromoBanner";
import { RotateCcw, Save } from "lucide-react";

const TYPE_LABELS: Record<PromoCampaignType, string> = {
  first_order: "İlk sifariş",
  referral: "Referral",
  limited_time: "Məhdud vaxt",
  seasonal: "Mövsümi",
};

function toDateTimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocalValue(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function HomePromoBannerManager() {
  const [rows, setRows] = useState<PromoCampaignStored[]>(() => [...DEFAULT_PROMO_CAMPAIGNS_STORED]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadHomePromoBannerFromRemote(true).then((base) => {
      const presetSet = new Set(PROMO_COLOR_PRESETS.map((p) => p.value));
      setRows(
        base.map((r) => ({
          ...r,
          color: presetSet.has(r.color) ? r.color : PROMO_COLOR_PRESETS[0].value,
        }))
      );
    });
  }, []);

  const updateRow = (id: string, patch: Partial<PromoCampaignStored>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const labels = useMemo(
    () => ["1-ci zolaq (sol növbə)", "2-ci zolaq", "3-cü zolaq — adətən geri sayım"],
    []
  );

  const save = async () => {
    const cleaned = rows.map((r) => ({
      ...r,
      title: r.title.trim(),
      description: r.description.trim(),
      cta: r.cta.trim(),
      badge: r.badge?.trim() || undefined,
      expiresAtIso: r.expiresAtIso?.trim() || null,
      color: r.color.trim() || PROMO_COLOR_PRESETS[0].value,
    }));
    if (cleaned.some((r) => !r.title || !r.cta)) {
      alert("Başlıq və düymə mətni boş ola bilməz");
      return;
    }
    setSaving(true);
    try {
      const saved = await saveHomePromoBannerRemote(cleaned);
      setRows(saved.map((r) => ({ ...r })));
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Serverə yazılmadı — yoxlayın və ya sonra yenidən cəhd edin");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm("Promo zolağını ilkin məzmun və rənglərə qaytarmaq istəyirsiniz?")) return;
    const defaults = resetHomePromoCampaigns();
    setRows(defaults.map((r) => ({ ...r })));
    setSaving(true);
    try {
      const saved = await saveHomePromoBannerRemote(defaults);
      setRows(saved.map((r) => ({ ...r })));
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Sıfırlama serverə yazılmadı");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Ana səhifə promo zolağı</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Ana səhifənin yuxarısındakı rəngli promo zolağı (badge, başlıq, təsvir, düymə mətni, geri sayım bitmə vaxtı,
          fon rəngi) buradan redaktə olunur. Məzmun serverdə saxlanır; ziyarətçilər səhifəni yenilədikdə yeni mətni
          görür. Backend söndükdə köhnə kimi yalnız bu brauzerin yaddaşı işləyir.
        </p>
      </div>

      <div className="space-y-4">
        {rows.map((row, idx) => (
          <Card key={row.id} className="p-5 border border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{labels[idx] ?? `Slayd ${row.id}`}</span>
              <span className="text-xs text-[var(--text-muted)]">{TYPE_LABELS[row.type] ?? row.type}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="text-[var(--text-secondary)]">Nişan (badge)</span>
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  value={row.badge ?? ""}
                  onChange={(e) => updateRow(row.id, { badge: e.target.value || undefined })}
                  placeholder="Məs: MƏHDUD"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-[var(--text-secondary)]">Başlıq</span>
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  value={row.title}
                  onChange={(e) => updateRow(row.id, { title: e.target.value })}
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-[var(--text-secondary)]">Təsvir</span>
                <textarea
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm min-h-[72px]"
                  value={row.description}
                  onChange={(e) => updateRow(row.id, { description: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Düymə (CTA)</span>
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  value={row.cta}
                  onChange={(e) => updateRow(row.id, { cta: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Fon rəngi</span>
                <select
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  value={PROMO_COLOR_PRESETS.some((p) => p.value === row.color) ? row.color : PROMO_COLOR_PRESETS[0].value}
                  onChange={(e) => updateRow(row.id, { color: e.target.value })}
                >
                  {PROMO_COLOR_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-[var(--text-secondary)]">Geri sayım bitmə vaxtı (boş = bu slaydda sayğac yoxdur)</span>
                <input
                  type="datetime-local"
                  className="mt-1 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  value={toDateTimeLocalValue(row.expiresAtIso ?? undefined)}
                  onChange={(e) => {
                    const iso = fromDateTimeLocalValue(e.target.value);
                    updateRow(row.id, { expiresAtIso: iso });
                  }}
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Saxlanmayıbsa, 3-cü slayd üçün sayt avtomatik 48 saatlıq geri sayım göstərə bilər.
                </p>
              </label>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={save} disabled={saving} icon={<Save className="w-4 h-4" />}>
          {saving ? "Saxlanır…" : "Saxla"}
        </Button>
        <Button type="button" variant="secondary" onClick={reset} icon={<RotateCcw className="w-4 h-4" />}>
          Sıfırla
        </Button>
      </div>
    </div>
  );
}
