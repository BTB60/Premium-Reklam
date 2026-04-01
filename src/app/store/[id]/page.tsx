"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { vendorStores, vendorProducts, auth, reviews, type VendorStore, type VendorProduct, type User, type Review } from "@/lib/db";
import { motion } from "framer-motion";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Star,
  ArrowLeft,
  Package,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

export default function StorePage() {
  const params = useParams();
  const storeId = params.id as string;

  const [store, setStore] = useState<VendorStore | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [storeReviews, setStoreReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  
  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxImage(images[index]);
    setLightboxOpen(true);
  };
  
  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage("");
  };
  
  const nextLightboxImage = () => {
    const nextIndex = (lightboxIndex + 1) % lightboxImages.length;
    setLightboxIndex(nextIndex);
    setLightboxImage(lightboxImages[nextIndex]);
  };
  
  const prevLightboxImage = () => {
    const prevIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
    setLightboxIndex(prevIndex);
    setLightboxImage(lightboxImages[prevIndex]);
  };
  
  // WhatsApp link generator
  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    setUser(currentUser);

    const storeData = vendorStores.getById(storeId);
    if (storeData) {
      setStore(storeData);
      setProducts(vendorProducts.getByStoreId(storeId));
      setStoreReviews(reviews.getByStoreId(storeId));
    }
    setLoading(false);
  }, [storeId]);

  const handleSubmitReview = () => {
    if (!user || !store) return;
    if (!newReview.comment.trim()) return;

    reviews.create({
      storeId: store.id,
      userId: user.id,
      userName: user.fullName,
      rating: newReview.rating,
      comment: newReview.comment,
    });

    setStoreReviews(reviews.getByStoreId(storeId));
    setShowReviewForm(false);
    setNewReview({ rating: 5, comment: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <Header />
        <div className="pt-24 text-center">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Mağaza tapılmadı</h1>
          <Link href="/marketplace">
            <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />}>
              Marketplace-ə qayıt
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />

      {/* Store Header */}
      <div 
        className="text-white pt-24 pb-12 relative"
        style={{
          background: store.banner 
            ? `linear-gradient(rgba(217, 4, 41, 0.9), rgba(239, 71, 111, 0.9)), url(${store.banner}) center/cover`
            : 'linear-gradient(to right, #D90429, #EF476F)'
        }}
      >
        {/* Watermark on banner */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/30 px-6 py-3 rounded-lg text-lg font-bold tracking-wider">
            www.premiumreklam.shop
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link href="/marketplace">
            <Button variant="ghost" className="text-white mb-4 -ml-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Marketplace
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-12 h-12 text-[#D90429]" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{store.name}</h1>
              <p className="text-white/90 mt-2 max-w-2xl">{store.description}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                <a href={`tel:${store.phone}`} className="flex items-center gap-1 hover:text-white/80">
                  <Phone className="w-4 h-4" />
                  {store.phone}
                </a>
                <a href={getWhatsAppLink(store.phone)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white/80 text-emerald-300">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {store.address}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {store.rating.toFixed(1)} ({store.reviewCount} rəy)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold mb-6">Məhsullar ({products.length})</h2>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Bu mağazada hələ məhsul yoxdur</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <ProductItem
                  key={product.id}
                  product={product}
                  storePhone={store.phone}
                  onImageClick={openLightbox}
                  whatsappLink={getWhatsAppLink(store.phone)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Reviews Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[#1F2937]">
              Müştəri Rəyləri ({storeReviews.length})
            </h2>
            {user && (
              <Button 
                onClick={() => setShowReviewForm(true)}
                variant="secondary"
              >
                Rəy yaz
              </Button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4">Rəyinizi yazın</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Reytinq</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className={`text-2xl ${star <= newReview.rating ? "text-amber-400" : "text-gray-300"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Rəyiniz</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    className="w-full p-3 border rounded-xl focus:outline-none focus:border-[#D90429]"
                    rows={3}
                    placeholder="Təcrübənizi paylaşın..."
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSubmitReview}>Göndər</Button>
                  <Button variant="ghost" onClick={() => setShowReviewForm(false)}>Ləğv et</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Reviews List */}
          <div className="grid md:grid-cols-2 gap-4">
            {storeReviews.length === 0 ? (
              <p className="text-gray-500 col-span-2 text-center py-8">Hələ rəy yoxdur</p>
            ) : (
              storeReviews.map((review) => (
                <Card key={review.id} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#D90429]/10 rounded-full flex items-center justify-center">
                      <span className="text-[#D90429] font-bold">
                        {review.userName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{review.userName}</p>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>{i < review.rating ? "★" : "☆"}</span>
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-sm text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("az-AZ")}
                    </span>
                  </div>
                  <p className="text-gray-600">{review.comment}</p>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button 
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          {/* Image Counter */}
          {lightboxImages.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 px-4 py-2 rounded-full text-white text-sm">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          )}
          
          {/* Main Image */}
          <img 
            src={lightboxImage} 
            alt=""
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Watermark */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 px-6 py-2 rounded-lg">
            <span className="text-white font-bold">www.premiumreklam.shop</span>
          </div>
          
          {/* Navigation Arrows */}
          {lightboxImages.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); prevLightboxImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextLightboxImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Product Item Component - Simple card with call button
function ProductItem({
  product,
  storePhone,
  onImageClick,
  whatsappLink,
}: {
  product: VendorProduct;
  storePhone: string;
  onImageClick: (images: string[], index: number) => void;
  whatsappLink: string;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = product.images || [];
  
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % Math.max(images.length, 1));
  };
  
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1));
  };

  return (
    <Card className="overflow-hidden border border-gray-200 hover:border-[#D90429] transition-all hover:shadow-lg">
      {/* Product Image */}
      <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden">
        {images.length > 0 ? (
          <div className="relative w-full h-full">
            <img 
              src={images[currentImageIndex]} 
              alt={product.name}
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => onImageClick(images, currentImageIndex)}
            />
            {/* Zoom Icon */}
            <div 
              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 cursor-zoom-in"
              onClick={() => onImageClick(images, currentImageIndex)}
            >
              <div className="bg-white/90 p-3 rounded-full">
                <ZoomIn className="w-6 h-6 text-[#D90429]" />
              </div>
            </div>
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm font-bold tracking-wide">
                www.premiumreklam.shop
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-300" />
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm font-bold tracking-wide">
                www.premiumreklam.shop
              </div>
            </div>
          </div>
        )}
        
        {/* Image Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Stock Badge */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
              Stok Yoxdur
            </span>
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-[#1F2937] line-clamp-1">{product.name}</h3>
          <span className="px-2 py-0.5 bg-[#D90429]/10 text-[#D90429] rounded text-xs font-medium whitespace-nowrap">
            {product.category}
          </span>
        </div>
        
        <p className="text-sm text-[#6B7280] line-clamp-2 mb-3">
          {product.description || "Təsvir yoxdur"}
        </p>

        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-2xl font-bold text-[#D90429]">
            {(product.price || 0).toFixed(2)}
          </span>
          <span className="text-gray-500">AZN/{product.unit}</span>
        </div>

        <div className="flex items-center justify-between">
          <p className={`text-sm ${product.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {product.stock > 0 ? `Stok: ${product.stock} ədəd` : "Stok bitib"}
          </p>
          <div className="flex gap-2">
            <a 
              href={`tel:${storePhone.replace(/\s/g, '')}`}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-[#1F2937] rounded-lg text-sm font-medium transition-colors"
            >
              <Phone className="w-4 h-4" />
            </a>
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
