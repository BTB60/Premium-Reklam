"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  vendorStores,
  vendorProducts,
  vendorOrders,
  auth,
  reviews,
  promoCodes,
  calculateCommission,
  type VendorStore,
  type VendorProduct,
  type User,
  type Review,
} from "@/lib/db";
import { motion } from "framer-motion";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Star,
  ShoppingBag,
  ArrowLeft,
  Plus,
  Minus,
  X,
  Check,
  Package,
} from "lucide-react";
import Link from "next/link";

export default function StorePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.id as string;
  const productId = searchParams.get("product");

  const [store, setStore] = useState<VendorStore | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [storeReviews, setStoreReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ product: VendorProduct; quantity: number }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");

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

  const handleApplyPromo = () => {
    if (!user || !promoCode.trim()) return;
    
    const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const result = promoCodes.validate(promoCode, user.id, cartTotal);
    
    if (result.valid) {
      setPromoDiscount(result.discount || 0);
      setPromoError("");
    } else {
      setPromoError(result.message);
      setPromoDiscount(0);
    }
  };

  const addToCart = (product: VendorProduct, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setShowCart(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const commission = calculateCommission(cartTotal).commission;
  const vendorTotal = calculateCommission(cartTotal).vendorTotal;

  const placeOrder = () => {
    if (!user || !store) return;

    // Create vendor order
    vendorOrders.create({
      orderId: `ORD-${Date.now()}`,
      vendorId: store.vendorId,
      customerId: user.id,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.product.price * item.quantity,
      })),
      subtotal: cartTotal,
      commission: commission,
      vendorTotal: vendorTotal,
      status: "pending",
    });

    setCart([]);
    setShowCart(false);
    setOrderSuccess(true);
    setTimeout(() => setOrderSuccess(false), 3000);
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
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {store.address}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {store.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {store.email}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {store.rating.toFixed(1)} ({store.reviewCount} rəy)
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{store.totalSales}</p>
              <p className="text-white/80">ümumi satış</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Məhsullar ({products.length})</h2>
            {cart.length > 0 && (
              <Button
                onClick={() => setShowCart(true)}
                icon={<ShoppingBag className="w-4 h-4" />}
              >
                Səbət ({cart.length})
              </Button>
            )}
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Bu mağazada hələ məhsul yoxdur</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductItem
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            className="w-full max-w-md bg-white h-full overflow-y-auto"
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Səbətiniz</h2>
              <button onClick={() => setShowCart(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Səbət boşdur</p>
              ) : (
                <>
                  {cart.map((item) => (
                    <Card key={item.product.id} className="p-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-gray-500">
                            {(item.product.price || 0).toFixed(2)} AZN/{item.product.unit}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="p-1 rounded hover:bg-gray-100"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="p-1 rounded hover:bg-gray-100"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="ml-auto text-red-500 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Promo Code */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Promo kod"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#D90429]"
                      />
                      <button
                        onClick={handleApplyPromo}
                        className="px-4 py-2 bg-[#D90429] text-white rounded-lg text-sm hover:bg-[#b80323]"
                      >
                        Tətbiq et
                      </button>
                    </div>
                    {promoError && <p className="text-red-500 text-xs">{promoError}</p>}
                    {promoDiscount > 0 && (
                      <p className="text-emerald-600 text-xs">Endirim tətbiq edildi: -{promoDiscount.toFixed(2)} AZN</p>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Məbləğ:</span>
                      <span>{cartTotal.toFixed(2)} AZN</span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Endirim:</span>
                        <span>-{promoDiscount.toFixed(2)} AZN</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Komissiya (5%):</span>
                      <span>{commission.toFixed(2)} AZN</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Ümumi:</span>
                      <span className="text-[#D90429]">{(cartTotal - promoDiscount).toFixed(2)} AZN</span>
                    </div>
                  </div>

                  {!user ? (
                    <Link href="/login">
                      <Button className="w-full">Daxil ol</Button>
                    </Link>
                  ) : (
                    <Button className="w-full" onClick={placeOrder}>
                      Sifarişi təsdiqlə
                    </Button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Message */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Sifariş qəbul edildi!</h3>
            <p className="text-gray-600">
              Sifarişiniz uğurla yerləşdirildi. Satıcı tezliklə sizinlə əlaqə saxlayacaq.
            </p>
          </motion.div>
        </div>
      )}

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
    </div>
  );
}

// Product Item Component
function ProductItem({
  product,
  onAddToCart,
}: {
  product: VendorProduct;
  onAddToCart: (product: VendorProduct, quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-16 h-16 text-gray-300" />
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold">Stok Bitib</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold">{product.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
          {product.description}
        </p>
        <div className="flex items-baseline gap-1 mt-3">
          <span className="text-2xl font-bold text-[#D90429]">
            {(product.price || 0).toFixed(2)}
          </span>
          <span className="text-gray-500">AZN/{product.unit}</span>
        </div>
        <p
          className={`text-sm mt-1 ${
            product.stock > 0 ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {product.stock > 0 ? `Stok: ${product.stock}` : "Stok bitib"}
        </p>

        {product.stock > 0 && (
          <div className="flex gap-2 mt-4">
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="p-2 hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <Button
              className="flex-1"
              onClick={() => onAddToCart(product, quantity)}
              icon={<ShoppingBag className="w-4 h-4" />}
            >
              Səbətə at
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
