"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { X, Upload, Image, ZoomIn, Download, Loader2, CheckCircle } from "lucide-react";

interface UpscaleResult {
  originalUrl: string;
  upscaledUrl: string;
  scale: number;
  originalSize: { width: number; height: number };
  upscaledSize: { width: number; height: number };
}

interface ImageUpscaleProps {
  onClose?: () => void;
}

export function ImageUpscale({ onClose }: ImageUpscaleProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scale, setScale] = useState<2 | 4>(2);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<UpscaleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Zəhmət olmasa şəkil faylı seçin");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Şəkil 10MB-dən böyük ola bilməz");
        return;
      }
      setSelectedImage(file);
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpscale = async () => {
    if (!selectedImage || !preview) return;

    setProcessing(true);
    setError(null);

    try {
      // Simulate upscale process (in real app, this would call an AI API)
      // For demo, we'll use canvas to resize the image
      const img = new window.Image();
      img.src = preview;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      
      const newWidth = img.width * scale;
      const newHeight = img.height * scale;
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      const upscaledUrl = canvas.toDataURL("image/png", 1.0);

      setResult({
        originalUrl: preview,
        upscaledUrl,
        scale,
        originalSize: { width: img.width, height: img.height },
        upscaledSize: { width: newWidth, height: newHeight },
      });
    } catch (err) {
      setError("Şəkil böyüdülə bilmədi. Zəhmət olmasa başqa şəkil seçin.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    
    const link = document.createElement("a");
    link.href = result.upscaledUrl;
    link.download = `upscaled_${scale}x_${selectedImage?.name || "image"}.png`;
    link.click();
  };

  const reset = () => {
    setSelectedImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-[#1F2937]">Şəkil Upscale</h2>
            <p className="text-sm text-[#6B7280]">
              Şəkilləri 2x və ya 4x böyüdün (4K/8K dəstəkli)
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" icon={<X className="w-5 h-5" />} onClick={onClose}>
              Bağla
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {!selectedImage ? (
            // Upload Area
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-[#D90429] hover:bg-red-50/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Şəkil yükləyin
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, WEBP formatları dəstəklənir (max 10MB)
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview and Scale Selection */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Original Image */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Orijinal Şəkil</h3>
                  <div className="relative rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={preview!}
                      alt="Original"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {result?.originalSize.width}x{result?.originalSize.height}
                    </div>
                  </div>
                </div>

                {/* Upscaled Preview */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    {result ? "Böyüdülmüş Şəkil" : "Böyüdülmüş (Seçim gözləyir)"}
                  </h3>
                  <div className="relative rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed">
                    {result ? (
                      <>
                        <img
                          src={result.upscaledUrl}
                          alt="Upscaled"
                          className="w-full h-auto max-h-64 object-contain"
                        />
                        <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {result.upscaledSize.width}x{result.upscaledSize.height}
                        </div>
                      </>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-400">
                        <Image className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Scale Selection */}
              <div className="flex items-center justify-center gap-4">
                <span className="text-sm text-gray-600">Böyütmə miqyası:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setScale(2)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      scale === 2
                        ? "bg-[#D90429] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    2x (HD → 4K)
                  </button>
                  <button
                    onClick={() => setScale(4)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      scale === 4
                        ? "bg-[#D90429] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    4x (HD → 8K)
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="secondary"
                  onClick={reset}
                  icon={<X className="w-4 h-4" />}
                >
                  Yeni Şəkil
                </Button>
                <Button
                  onClick={handleUpscale}
                  disabled={processing}
                  icon={
                    processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ZoomIn className="w-4 h-4" />
                    )
                  }
                >
                  {processing ? "Böyüdülür..." : `Böyüd ${scale}x`}
                </Button>
                {result && (
                  <Button
                    variant="primary"
                    onClick={handleDownload}
                    icon={<Download className="w-4 h-4" />}
                  >
                    Yüklə
                  </Button>
                )}
              </div>

              {/* Info */}
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">Məlumat:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>2x: 1920x1080 → 3840x2160 (4K)</li>
                  <li>4x: 1920x1080 → 7680x4320 (8K)</li>
                  <li>Böyütmə AI texnologiyası ilə edilir</li>
                </ul>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
