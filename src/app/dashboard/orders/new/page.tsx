"use client";

import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/Button";
import { Card, ProductCard } from "@/components/ui/Card";
import { Input, Select, TextArea } from "@/components/ui/Input";
import { FileUpload } from "@/components/ui/FileUpload";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Ruler,
  CreditCard,
  CheckCircle,
  Package,
  FileUp,
  MessageSquare
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { productApi } from "@/lib/authApi";

// Step Indicator
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        
        return (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                isActive
                  ? "bg-[#D90429] text-white"
                  : isCompleted
                  ? "bg-[#16A34A] text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {isCompleted ? <CheckCircle className="w-5 h-5" /> : step}
            </div>
            {step < totalSteps && (
              <div
                className={`w-12 h-1 mx-2 rounded-full ${
                  isCompleted ? "bg-[#16A34A]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

type CatalogItem = { id: number; name: string; description: string; price: number; category: string };

// Product Selection Step — yalnız backend kataloqu (admin əlavələri)
function ProductSelection({
  products,
  loading,
  onSelect,
  selected,
}: {
  products: CatalogItem[];
  loading: boolean;
  onSelect: (product: CatalogItem) => void;
  selected: CatalogItem | null;
}) {
  const categories = [
    "Hamısı",
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(),
  ];
  const [activeCategory, setActiveCategory] = useState("Hamısı");

  const filteredProducts =
    activeCategory === "Hamısı"
      ? products
      : products.filter((p) => p.category === activeCategory);

  if (loading) {
    return (
      <Card className="p-8 text-center text-[#6B7280]">Məhsullar yüklənir...</Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="p-6 text-center text-[#6B7280]">
        Hal-hazırda kataloqda məhsul yoxdur. Yalnız admin paneldə əlavə olunan məhsullar burada
        görünür.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === category
                ? "bg-[#D90429] text-white"
                : "bg-white text-[#6B7280] border border-[#E5E7EB]"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid gap-3">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            name={product.name}
            description={product.description}
            price={product.price}
            selected={selected?.id === product.id}
            onSelect={() => onSelect(product)}
          />
        ))}
      </div>
    </div>
  );
}

// Size Input Step
function SizeInput({ sizes, onChange, onAdd, onRemove }: { 
  sizes: { width: number; height: number }[]; 
  onChange: (index: number, field: "width" | "height", value: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#1F2937] font-[Manrope]">Ölçülər</h3>
        <Button variant="secondary" size="sm" onClick={onAdd} icon={<Plus className="w-4 h-4" />}>
          Ölçü Əlavə Et
        </Button>
      </div>

      <div className="space-y-3">
        {sizes.map((size, index) => (
          <Card key={index} className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Ruler className="w-4 h-4 text-[#D90429]" />
              <span className="font-medium text-[#1F2937]">Ölçü {index + 1}</span>
              {sizes.length > 1 && (
                <button
                  onClick={() => onRemove(index)}
                  className="ml-auto p-2 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-[#6B7280] mb-1 block">En (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={size.width || ""}
                  onChange={(e) => onChange(index, "width", parseFloat(e.target.value) || 0)}
                  className="w-full h-12 rounded-[14px] border border-[#E5E7EB] px-4 focus:outline-none focus:border-[#D90429]"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm text-[#6B7280] mb-1 block">Hündürlük (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={size.height || ""}
                  onChange={(e) => onChange(index, "height", parseFloat(e.target.value) || 0)}
                  className="w-full h-12 rounded-[14px] border border-[#E5E7EB] px-4 focus:outline-none focus:border-[#D90429]"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">Sahə:</span>
                <span className="font-semibold text-[#1F2937]">{(size.width * size.height).toFixed(2)} m²</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// File Upload & Notes Step
function FileAndNotesStep({ 
  files, 
  onFilesChange, 
  notes, 
  onNotesChange 
}: { 
  files: File[]; 
  onFilesChange: (files: File[]) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
            <FileUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#1F2937] font-[Manrope]">Fayllar</h3>
            <p className="text-sm text-[#6B7280]">Dizayn, ölçü və ya digər fayllar</p>
          </div>
        </div>
        <FileUpload 
          onFilesSelected={onFilesChange}
          maxFiles={5}
          maxSize={50}
          accept="image/*,.pdf,.ai,.psd,.cdr,.dwg,.dxf"
        />
      </Card>

      {/* Notes */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#D90429]/10 flex items-center justify-center text-[#D90429]">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#1F2937] font-[Manrope]">Əlavə Qeydlər</h3>
            <p className="text-sm text-[#6B7280]">Sifarişlə bağlı xüsusi istəkləriniz</p>
          </div>
        </div>
        <TextArea
          value={notes}
          onChange={onNotesChange}
          placeholder="Məsələn: Otaq şimal tərəfə baxır, günəş işığı çox düşür. Qalın və qaranlıq rəng seçilsin..."
          rows={5}
        />
      </Card>

      {/* Tips */}
      <div className="bg-[#D90429]/5 rounded-xl p-4 border border-[#D90429]/20">
        <p className="text-sm text-[#1F2937] font-medium mb-2">💡 Məsləhətlər:</p>
        <ul className="text-sm text-[#6B7280] space-y-1">
          <li>• Dizayn fayllarını AI, PSD, PDF formatında yükləyin</li>
          <li>• Ölçü sxemlərini DWG və ya DXF formatında əlavə edin</li>
          <li>• Referans şəkilləri JPG və ya PNG formatında yükləyin</li>
          <li>• Xüsusi istəklərinizi ətraflı qeyd edin</li>
        </ul>
      </div>
    </div>
  );
}

// Price Summary Step
function PriceSummary({ product, sizes, totalArea, totalPrice, notes, files }: { 
  product: any; 
  sizes: any[]; 
  totalArea: number;
  totalPrice: number;
  notes?: string;
  files?: File[];
}) {
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-[#D90429] to-[#EF476F] text-white border-none">
        <div className="text-center py-4">
          <p className="text-white/80 text-sm mb-1">Ümumi Qiymət</p>
          <p className="text-4xl font-bold font-[Manrope]">{totalPrice.toFixed(0)} AZN</p>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-[#1F2937] font-[Manrope] mb-4">Sifariş Detalları</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB]">
            <span className="text-[#6B7280]">Məhsul</span>
            <span className="font-medium text-[#1F2937]">{product?.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB]">
            <span className="text-[#6B7280]">Vahid Qiymət</span>
            <span className="font-medium text-[#1F2937]">{product?.price ?? 0} AZN/m²</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB]">
            <span className="text-[#6B7280]">Ümumi Sahə</span>
            <span className="font-medium text-[#1F2937]">{totalArea.toFixed(2)} m²</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB]">
            <span className="text-[#6B7280]">Ölçü Sayı</span>
            <span className="font-medium text-[#1F2937]">{sizes.length} ədəd</span>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-[#1F2937] font-[Manrope] mb-4">Ödəniş Üsulu</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#D90429] bg-[#D90429]/5 cursor-pointer">
            <input type="radio" name="payment" defaultChecked className="w-5 h-5 accent-[#D90429]" />
            <CreditCard className="w-5 h-5 text-[#D90429]" />
            <div>
              <p className="font-medium text-[#1F2937]">Nağd Ödəniş</p>
              <p className="text-sm text-[#6B7280]">Quraşdırmadan sonra</p>
            </div>
          </label>
          <label className="flex items-center gap-3 p-4 rounded-xl border border-[#E5E7EB] cursor-pointer">
            <input type="radio" name="payment" className="w-5 h-5 accent-[#D90429]" />
            <CreditCard className="w-5 h-5 text-[#6B7280]" />
            <div>
              <p className="font-medium text-[#1F2937]">Kartla Ödəniş</p>
              <p className="text-sm text-[#6B7280]">Onlayn ödəniş</p>
            </div>
          </label>
        </div>
      </Card>
    </div>
  );
}

// Success Step
function SuccessStep() {
  return (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#16A34A]/10 flex items-center justify-center"
      >
        <CheckCircle className="w-12 h-12 text-[#16A34A]" />
      </motion.div>
      <h2 className="text-2xl font-bold text-[#1F2937] mb-2 font-[Manrope]">
        Sifarişiniz Alındı!
      </h2>
      <p className="text-[#6B7280] mb-6">
        Sifarişiniz uğurla qeydə alındı. Tezliklə sizinlə əlaqə saxlanılacaq.
      </p>
      <div className="flex gap-3 justify-center">
        <Button variant="secondary">Sifarişlərim</Button>
        <Button>Yeni Sifariş</Button>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [sizes, setSizes] = useState([{ width: 0, height: 0 }]);
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setCatalogLoading(true);
      try {
        const list = await productApi.getActiveCatalog();
        const mapped: CatalogItem[] = list.map((p) => ({
          id: typeof p.id === "number" ? p.id : Number(p.id),
          name: p.name,
          description: p.description || "",
          price: Number(p.salePrice) || 0,
          category: (p.category || "Digər").trim() || "Digər",
        }));
        if (!cancelled) setCatalogProducts(mapped);
      } catch {
        if (!cancelled) setCatalogProducts([]);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleAddSize = () => {
    setSizes([...sizes, { width: 0, height: 0 }]);
  };

  const handleRemoveSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleSizeChange = (index: number, field: "width" | "height", value: number) => {
    const newSizes = [...sizes];
    newSizes[index][field] = value;
    setSizes(newSizes);
  };

  const totalArea = sizes.reduce((acc, size) => acc + size.width * size.height, 0);
  const totalPrice = selectedProduct ? totalArea * selectedProduct.price : 0;

  const stepTitles = ["", "Məhsul Seç", "Ölçü Əlavə Et", "Fayl & Qeyd", "Qiyməti Yoxla", "Tamamlandı"];

  return (
    <main className="min-h-screen bg-[#F8F9FB] pb-24 md:pb-8">
      <Header variant="decorator" userName="Əli Vəliyev" />
      
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Back Button */}
        {step < 4 && (
          <button
            onClick={step === 1 ? () => window.history.back() : handleBack}
            className="flex items-center gap-2 text-[#6B7280] hover:text-[#D90429] transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Geri</span>
          </button>
        )}

        {/* Title */}
        {step < 4 && (
          <h1 className="text-2xl font-bold text-[#1F2937] mb-2 font-[Manrope]">
            {stepTitles[step]}
          </h1>
        )}

        {/* Step Indicator */}
        {step < 5 && <StepIndicator currentStep={step} totalSteps={4} />}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && (
              <ProductSelection
                products={catalogProducts}
                loading={catalogLoading}
                onSelect={(product) => {
                  setSelectedProduct(product);
                  handleNext();
                }}
                selected={selectedProduct}
              />
            )}
            
            {step === 2 && (
              <SizeInput
                sizes={sizes}
                onChange={handleSizeChange}
                onAdd={handleAddSize}
                onRemove={handleRemoveSize}
              />
            )}

            {step === 3 && (
              <FileAndNotesStep
                files={files}
                onFilesChange={setFiles}
                notes={notes}
                onNotesChange={setNotes}
              />
            )}
            
            {step === 4 && (
              <PriceSummary
                product={selectedProduct}
                sizes={sizes}
                totalArea={totalArea}
                totalPrice={totalPrice}
                notes={notes}
                files={files}
              />
            )}
            
            {step === 5 && <SuccessStep />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {step < 5 && step > 1 && (
          <div className="fixed bottom-20 left-0 right-0 px-4 md:relative md:bottom-0 md:px-0 md:mt-6">
            <div className="max-w-lg mx-auto flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleBack}>
                Geri
              </Button>
              <Button 
                className="flex-1" 
                onClick={step === 4 ? () => setStep(5) : handleNext}
                disabled={step === 2 && sizes.some(s => s.width === 0 || s.height === 0)}
              >
                {step === 4 ? "Sifariş Et" : "Davam Et"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <MobileNav variant="decorator" />
    </main>
  );
}
