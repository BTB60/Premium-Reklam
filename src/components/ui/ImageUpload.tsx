"use client";

import { useState, useRef } from "react";
import { Camera, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange: (base64: string | undefined) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  aspectRatio?: "square" | "banner" | "portrait";
}

export function ImageUpload({
  value,
  onChange,
  label,
  placeholder = "Şəkil yüklə",
  className = "",
  aspectRatio = "square",
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClasses = {
    square: "aspect-square",
    banner: "aspect-[3/1]",
    portrait: "aspect-[3/4]",
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Yalnız şəkil faylları yüklənə bilər");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Şəkil həcmi 2MB-dan çox ola bilməz");
      return;
    }

    setLoading(true);

    try {
      const base64 = await fileToBase64(file);
      onChange(base64);
    } catch (error) {
      alert("Şəkil yüklənərkən xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleRemove = () => {
    onChange(undefined);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {value ? (
        <div className={`relative ${aspectRatioClasses[aspectRatio]} rounded-xl overflow-hidden group`}>
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            >
              <Camera className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className={`w-full ${aspectRatioClasses[aspectRatio]} border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#D90429] hover:bg-[#D90429]/5 transition-colors disabled:opacity-50`}
        >
          {loading ? (
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          ) : (
            <>
              <Camera className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-500">{placeholder}</span>
              <span className="text-xs text-gray-400">(max 2MB)</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// Multiple Image Upload Component
interface MultiImageUploadProps {
  values: string[];
  onChange: (base64Array: string[]) => void;
  label?: string;
  maxImages?: number;
}

export function MultiImageUpload({
  values = [],
  onChange,
  label,
  maxImages = 5,
}: MultiImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (values.length + files.length > maxImages) {
      alert(`Maksimum ${maxImages} şəkil yükləyə bilərsiniz`);
      return;
    }

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        alert("Yalnız şəkil faylları yüklənə bilər");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert("Hər şəkil 2MB-dan çox ola bilməz");
        return;
      }
    }

    setLoading(true);

    try {
      const base64Array = await Promise.all(files.map(fileToBase64));
      onChange([...values, ...base64Array]);
    } catch (error) {
      alert("Şəkillər yüklənərkən xəta baş verdi");
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleRemove = (index: number) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    onChange(newValues);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} ({values.length}/{maxImages})
        </label>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {values.map((value, index) => (
          <div key={index} className="aspect-square rounded-lg overflow-hidden relative group">
            <img
              src={value}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {values.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-[#D90429] hover:bg-[#D90429]/5 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            ) : (
              <>
                <Camera className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-400">Əlavə et</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
