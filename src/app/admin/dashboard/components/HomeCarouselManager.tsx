"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  fileToDataUrl,
  getHomeCarouselSlides,
  loadHomeCarouselSlides,
  resetHomeCarouselSlides,
  saveHomeCarouselSlides,
  saveHomeCarouselSlidesRemote,
  type HomeCarouselSlide,
} from "@/lib/homeCarousel";
import { Image as ImageIcon, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";

export default function HomeCarouselManager() {
  const [slides, setSlides] = useState<HomeCarouselSlide[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setSlides(getHomeCarouselSlides());
    void loadHomeCarouselSlides(true).then(setSlides);
  }, []);

  const updateSlide = (id: string, patch: Partial<HomeCarouselSlide>) => {
    setSlides((prev) => prev.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)));
  };

  const handleFile = async (id: string, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Yalnız şəkil faylı yükləyin");
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      alert("Şəkil 2.5 MB-dan böyük olmamalıdır");
      return;
    }
    const image = await fileToDataUrl(file);
    updateSlide(id, { image });
  };

  const addSlide = () => {
    setSlides((prev) => [
      ...prev,
      {
        id: `slide-${Date.now()}`,
        title: "Yeni slayd",
        description: "Qısa açıqlama yazın",
        image: prev[0]?.image || "",
      },
    ]);
  };

  const removeSlide = (id: string) => {
    setSlides((prev) => (prev.length <= 1 ? prev : prev.filter((slide) => slide.id !== id)));
  };

  const save = async () => {
    const cleaned = slides
      .map((slide) => ({
        ...slide,
        title: slide.title.trim(),
        description: slide.description.trim(),
      }))
      .filter((slide) => slide.title && slide.image);
    if (cleaned.length === 0) {
      alert("Ən azı 1 karusel şəkli olmalıdır");
      return;
    }
    setSaving(true);
    try {
      saveHomeCarouselSlides(cleaned);
      const saved = await saveHomeCarouselSlidesRemote(cleaned);
      setSlides(saved);
    } catch (error) {
      console.error("[HomeCarouselManager] save error", error);
      alert(error instanceof Error ? error.message : "Karusel saxlanmadı");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm("Karuseli ilkin vəziyyətə qaytarmaq istəyirsiniz?")) return;
    const defaults = resetHomeCarouselSlides();
    setSlides(defaults);
    try {
      const saved = await saveHomeCarouselSlidesRemote(defaults);
      setSlides(saved);
    } catch (error) {
      console.error("[HomeCarouselManager] reset error", error);
      alert(error instanceof Error ? error.message : "Karusel sıfırlanmadı");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Ana Səhifə Karuseli</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Ana səhifədə görünən karusel şəkillərini və mətnlərini buradan dəyişin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<RotateCcw className="w-4 h-4" />} onClick={() => void reset()}>
            Sıfırla
          </Button>
          <Button icon={<Save className="w-4 h-4" />} loading={saving} onClick={() => void save()}>
            Yadda saxla
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {slides.map((slide, index) => (
          <Card key={slide.id} className="p-4">
            <div className="grid lg:grid-cols-[18rem_1fr] gap-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                {slide.image ? (
                  <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[#1F2937]">Slayd {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeSlide(slide.id)}
                    disabled={slides.length <= 1}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40"
                    title="Slaydı sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <input
                  value={slide.title}
                  onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                  placeholder="Başlıq"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                />
                <textarea
                  value={slide.description}
                  onChange={(e) => updateSlide(slide.id, { description: e.target.value })}
                  placeholder="Açıqlama"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                />

                <input
                  ref={(el) => {
                    fileInputs.current[slide.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleFile(slide.id, e.target.files?.[0])}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Upload className="w-4 h-4" />}
                  onClick={() => fileInputs.current[slide.id]?.click()}
                >
                  Şəkil dəyiş
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button variant="secondary" className="mt-4 w-full" icon={<Plus className="w-4 h-4" />} onClick={addSlide}>
        Yeni slayd əlavə et
      </Button>
    </div>
  );
}
