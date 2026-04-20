"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/authApi";
import { notifyVendorStoreRequestSubmitted } from "@/lib/vendorStoreNotifyApi";
import { storeRequests, vendorStores, vendorProducts, type StoreRequest, type VendorStore, type VendorProduct } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { 
  Store, 
  Plus, 
  CheckCircle, 
  Clock, 
  XCircle,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  FileText,
  Tag,
  Loader2,
  Edit,
  Image,
  X,
  Package,
  Eye
} from "lucide-react";
import Link from "next/link";

export default function MyStorePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myStore, setMyStore] = useState<VendorStore | null>(null);
  const [myProducts, setMyProducts] = useState<VendorProduct[]>([]);
  const [myRequest, setMyRequest] = useState<StoreRequest | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editData, setEditData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    logo: "",
    banner: "",
    categories: [] as string[],
  });

  // Helper function to check if request is rejected
  const isRejected = (req: StoreRequest | null): req is StoreRequest => {
    return req !== null && req.status === "rejected";
  };
  
  // Form state for new store request
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    categories: [] as string[],
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const currentUser = authApi.getCurrentUser() as any;

    if (!currentUser) {
      router.push("/login");
      return;
    }

    setUser(currentUser);
    
    // Check if user already has a store
    const existingStore = vendorStores.getByVendorId(currentUser.id);
    if (existingStore?.isApproved) {
      setMyStore(existingStore);
      setMyProducts(vendorProducts.getByVendorId(currentUser.id));
      setEditData({
        name: existingStore.name,
        description: existingStore.description,
        address: existingStore.address,
        phone: existingStore.phone,
        email: existingStore.email || "",
        logo: existingStore.logo || "",
        banner: existingStore.banner || "",
        categories: existingStore.category || [],
      });
    }
    
    // Check if user has a pending request
    const existingRequest = storeRequests.getByVendorId(currentUser.id);
    if (existingRequest && existingRequest.status === "pending") {
      setMyRequest(existingRequest);
    }
    
    setLoading(false);
  }, [router]);

  const categories = [
    "Vinil Banner",
    "Orakal",
    "Laminasiya",
    "Karton",
    "Plexi",
    "Dizayn",
    "UV Çap",
    "Loqotip",
    "Banner",
    "İşıqlı Qutu",
  ];

  const toggleCategory = (category: string, isEditForm: boolean = false) => {
    if (isEditForm) {
      setEditData(prev => ({
        ...prev,
        categories: prev.categories.includes(category)
          ? prev.categories.filter(c => c !== category)
          : [...prev.categories, category]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.includes(category)
          ? prev.categories.filter(c => c !== category)
          : [...prev.categories, category]
      }));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditForm: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (isEditForm) {
        setEditData(prev => ({ ...prev, logo: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditForm: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (isEditForm) {
        setEditData(prev => ({ ...prev, banner: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = async () => {
    if (!myStore) return;

    setSubmitting(true);
    try {
      vendorStores.update(myStore.id, {
        name: editData.name.trim(),
        description: editData.description.trim(),
        address: editData.address.trim(),
        phone: editData.phone.trim(),
        email: editData.email.trim(),
        logo: editData.logo,
        banner: editData.banner,
        category: editData.categories,
      });

      // Refresh store
      const updated = vendorStores.getByVendorId(user.id);
      setMyStore(updated || null);
      setShowEditForm(false);
      alert("Mağaza məlumatları yeniləndi!");
    } catch (error: any) {
      alert(error.message || "Xəta baş verdi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setFormError("Mağaza adı daxil edin");
      return;
    }
    if (!formData.description.trim()) {
      setFormError("Mağaza təsviri daxil edin");
      return;
    }
    if (!formData.address.trim()) {
      setFormError("Ünvan daxil edin");
      return;
    }
    if (!formData.phone.trim()) {
      setFormError("Telefon nömrəsi daxil edin");
      return;
    }
    if (formData.categories.length === 0) {
      setFormError("Ən azı bir kateqoriya seçin");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const created = storeRequests.create({
        vendorId: user.id,
        vendorName: user.fullName,
        vendorPhone: user.phone || "",
        name: formData.name.trim(),
        description: formData.description.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || user.email || "",
        category: formData.categories,
      });

      void notifyVendorStoreRequestSubmitted({
        requestId: created.id,
        storeName: created.name,
      });

      const request = storeRequests.getByVendorId(user.id);
      setMyRequest(request || null);
      setShowForm(false);
      
      alert("Mağaza müraciətiniz uğurla göndərildi! Admin təsdiqlədikdən sonra mağazanız aktiv olacaq.");
      
      setFormData({
        name: "",
        description: "",
        address: "",
        phone: "",
        email: "",
        categories: [],
      });
    } catch (error: any) {
      setFormError(error.message || "Xəta baş verdi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#D90429] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // User already has an approved store
  if (myStore) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        {/* Header */}
        <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-[#1F2937]">Mağazam</h1>
              <p className="text-xs text-[#6B7280]">Marketplace</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/store/orders">
                <Button variant="secondary" icon={<Store className="w-4 h-4" />}>
                  Sifarişlər
                </Button>
              </Link>
              <Link href="/dashboard/store/products">
                <Button variant="secondary" icon={<Package className="w-4 h-4" />}>
                  Məhsullar ({myProducts.length})
                </Button>
              </Link>
              <Button onClick={() => setShowEditForm(true)} icon={<Edit className="w-4 h-4" />}>
                Redaktə Et
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Store Banner & Logo */}
            <div className="relative mb-8">
              {/* Banner */}
              <div className="h-48 bg-gradient-to-r from-[#D90429] to-[#EF476F] rounded-2xl overflow-hidden">
                {myStore.banner ? (
                  <img src={myStore.banner} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-16 h-16 text-white/30" />
                  </div>
                )}
              </div>
              
              {/* Logo */}
              <div className="absolute -bottom-12 left-8">
                <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
                  {myStore.logo ? (
                    <img src={myStore.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-12 h-12 text-[#D90429]" />
                  )}
                </div>
              </div>
            </div>

            {/* Store Info */}
            <div className="ml-36 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-[#1F2937]">{myStore.name}</h2>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  Aktiv
                </span>
              </div>
              <p className="text-[#6B7280]">{myStore.description}</p>
            </div>

            {/* Store Details */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#D90429]/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-[#D90429]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Ünvan</p>
                    <p className="font-medium text-[#1F2937]">{myStore.address}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#D90429]/10 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-[#D90429]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Telefon</p>
                    <p className="font-medium text-[#1F2937]">{myStore.phone}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#D90429]/10 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#D90429]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Email</p>
                    <p className="font-medium text-[#1F2937]">{myStore.email || "-"}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Categories */}
            <Card className="p-6 mb-6">
              <h3 className="font-bold text-[#1F2937] mb-4">Kateqoriyalar</h3>
              <div className="flex flex-wrap gap-2">
                {myStore.category.map((cat: string, idx: number) => (
                  <span key={idx} className="px-4 py-2 bg-[#D90429]/10 text-[#D90429] rounded-full text-sm font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            </Card>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="p-6 text-center">
                <p className="text-3xl font-bold text-[#D90429]">{myStore.totalSales}</p>
                <p className="text-sm text-[#6B7280]">Ümumi Satış</p>
              </Card>
              <Card className="p-6 text-center">
                <p className="text-3xl font-bold text-[#D90429]">{myStore.rating.toFixed(1)}</p>
                <p className="text-sm text-[#6B7280]">Reytinq</p>
              </Card>
              <Card className="p-6 text-center">
                <p className="text-3xl font-bold text-[#D90429]">{myStore.reviewCount}</p>
                <p className="text-sm text-[#6B7280]">Rəy</p>
              </Card>
              <Card className="p-6 text-center">
                <p className="text-3xl font-bold text-[#D90429]">{myProducts.length}</p>
                <p className="text-sm text-[#6B7280]">Məhsul</p>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex gap-4">
              <Link href={`/store/${myStore.id}`}>
                <Button icon={<Eye className="w-4 h-4" />}>
                  Mağazaya Bax
                </Button>
              </Link>
              <Link href="/dashboard/store/products">
                <Button variant="secondary" icon={<Package className="w-4 h-4" />}>
                  Məhsulları İdarə Et
                </Button>
              </Link>
            </div>
          </motion.div>
        </main>

        {/* Edit Store Modal */}
        {showEditForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#E5E7EB] sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#1F2937]">Mağazanı Redaktə Et</h2>
                  <button 
                    onClick={() => setShowEditForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">Loqo Şəkili</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                      {editData.logo ? (
                        <img src={editData.logo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, true)}
                      className="hidden"
                    />
                    <Button 
                      variant="secondary" 
                      onClick={() => logoInputRef.current?.click()}
                      icon={<Image className="w-4 h-4" />}
                    >
                      Loqo Yüklə
                    </Button>
                  </div>
                </div>

                {/* Banner Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">Banner Şəkili</label>
                  <div className="h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                    {editData.banner ? (
                      <img src={editData.banner} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-gray-400">
                        <Image className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Banner yüklə</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleBannerUpload(e, true)}
                    className="hidden"
                  />
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => bannerInputRef.current?.click()}
                    icon={<Image className="w-4 h-4" />}
                  >
                    Banner Yüklə
                  </Button>
                </div>

                {/* Store Name */}
                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">Mağaza Adı *</label>
                  <Input
                    value={editData.name}
                    onChange={(value) => setEditData({...editData, name: value})}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">Təsvir *</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                    rows={3}
                  />
                </div>

                {/* Address & Phone */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#6B7280] mb-2">Ünvan *</label>
                    <Input
                      value={editData.address}
                      onChange={(value) => setEditData({...editData, address: value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6B7280] mb-2">Telefon *</label>
                    <Input
                      value={editData.phone}
                      onChange={(value) => setEditData({...editData, phone: value})}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">Email</label>
                  <Input
                    value={editData.email}
                    onChange={(value) => setEditData({...editData, email: value})}
                  />
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">Kateqoriyalar *</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category, true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          editData.categories.includes(category)
                            ? "bg-[#D90429] text-white"
                            : "bg-gray-100 text-[#6B7280] hover:bg-gray-200"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[#E5E7EB] flex gap-4 sticky bottom-0 bg-white">
                <Button 
                  onClick={handleEditSubmit} 
                  disabled={submitting}
                  icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                >
                  {submitting ? "Göndərilir..." : "Yadda Saxla"}
                </Button>
                <Button variant="ghost" onClick={() => setShowEditForm(false)}>
                  Ləğv Et
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // User has a pending request
  if (myRequest) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-[#1F2937]">Mağaza Müraciəti</h1>
              <p className="text-xs text-[#6B7280]">Marketplace</p>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-6 mb-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">Gözləyən Müraciət</h2>
                  <p className="opacity-90">Mağaza müraciətiniz admin təsdiqini gözləyir</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-[#1F2937] mb-4">Müraciət Detalları</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Store className="w-5 h-5 text-[#6B7280] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#6B7280]">Mağaza Adı</p>
                    <p className="font-medium text-[#1F2937]">{myRequest.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[#6B7280] mt-0.5" />
                  <div>
                    <p className="text-sm text-[#6B7280]">Təsvir</p>
                    <p className="font-medium text-[#1F2937]">{myRequest.description}</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-6">
              <Link href="/dashboard">
                <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
                  Dashboard-a Qayıt
                </Button>
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // User has a rejected request
  if (isRejected(myRequest)) {
    const request = myRequest as StoreRequest;
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-[#1F2937]">Mağaza Müraciəti</h1>
              <p className="text-xs text-[#6B7280]">Marketplace</p>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-6 mb-6 bg-gradient-to-r from-red-500 to-red-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <XCircle className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">Müraciət Rədd Edildi</h2>
                  <p className="opacity-90">Mağaza müraciətiniz admin tərəfindən rədd edilmişdir</p>
                </div>
              </div>
            </Card>

            {request.rejectionReason && (
              <Card className="p-6 mb-6 border-red-200 bg-red-50">
                <h3 className="font-bold text-red-700 mb-2">Rədd Edilmə Səbəbi</h3>
                <p className="text-red-600">{request.rejectionReason}</p>
              </Card>
            )}

            <div className="mt-6">
              <Button 
                onClick={() => {
                  storeRequests.delete(request.id);
                  setMyRequest(null);
                  setShowForm(true);
                }} 
                icon={<Plus className="w-4 h-4" />}
              >
                Yenidən Müraciət Et
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Show form to create new store request
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-[#1F2937]">Marketplace-də Mağaza Aç</h1>
            <p className="text-xs text-[#6B7280]">Öz mağazanızı yaradın</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-6 mb-6 bg-gradient-to-r from-[#D90429] to-[#EF476F] text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Marketplace-də Öz Mağazanızı Yaradın</h3>
                <p className="opacity-90 text-sm">
                  Marketplace-də mağaza açmaq üçün müraciət edin. Admin təsdiqlədikdən sonra 
                  mağazanız aktiv olacaq və minlərlə müştəriyə görünəcək.
                </p>
              </div>
            </div>
          </Card>

          {showForm ? (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-[#1F2937] mb-6">Mağaza Məlumatları</h2>
              
              {formError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">Mağaza Adı *</label>
                  <Input
                    placeholder="Məs: Premium Reklam"
                    value={formData.name}
                    onChange={(value) => setFormData({...formData, name: value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">Təsvir *</label>
                  <textarea
                    placeholder="Mağazanız haqqında qısa məlumat..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">Ünvan *</label>
                  <Input
                    placeholder="Bakı, Nərimanov rayonu..."
                    value={formData.address}
                    onChange={(value) => setFormData({...formData, address: value})}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#6B7280] mb-2">Telefon *</label>
                    <Input
                      placeholder="050 000 00 00"
                      value={formData.phone}
                      onChange={(value) => setFormData({...formData, phone: value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6B7280] mb-2">Email</label>
                    <Input
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(value) => setFormData({...formData, email: value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">
                    Kateqoriyalar * (ən azı 1 seçin)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.categories.includes(category)
                            ? "bg-[#D90429] text-white"
                            : "bg-gray-100 text-[#6B7280] hover:bg-gray-200"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                >
                  {submitting ? "Göndərilir..." : "Müraciət Et"}
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Ləğv Et
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-[#D90429]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Store className="w-10 h-10 text-[#D90429]" />
              </div>
              <h2 className="text-xl font-bold text-[#1F2937] mb-2">
                Hələ mağazanız yoxdur
              </h2>
              <p className="text-[#6B7280] mb-6">
                Marketplace-də öz mağazanızı açın və məhsullarınızı satışa çıxarın
              </p>
              <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
                Mağaza Aç
              </Button>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}
