"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  auth,
  vendorStores,
  vendorProducts,
  type User,
  type VendorStore,
  type VendorProduct,
} from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ImageUpload, MultiImageUpload } from "@/components/ui/ImageUpload";
import {
  Store,
  User as UserIcon,
  Package,
  Lock,
  Bell,
  Mail,
  Phone,
  MapPin,
  Save,
  Check,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<VendorStore | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "store" | "security" | "notifications">("profile");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    const userStore = vendorStores.getByVendorId(currentUser.id);
    if (userStore) {
      setStore(userStore);
      setProducts(vendorProducts.getByVendorId(currentUser.id));
    }
    setLoading(false);
  }, [router]);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />

      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-bold text-[#1F2937]">Tənzimləmələr</h1>
            <p className="text-[#6B7280] mt-1">Profil və mağaza məlumatlarınızı idarə edin</p>
          </motion.div>

          {/* Success Message */}
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
            >
              <Check className="w-5 h-5 text-emerald-500" />
              <p className="text-emerald-700">Dəyişikliklər yadda saxlanıldı!</p>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: "profile", label: "Profilim", icon: UserIcon },
              ...(store ? [{ id: "store", label: "Mağazam", icon: Store }] : []),
              { id: "security", label: "Təhlükəsizlik", icon: Lock },
              { id: "notifications", label: "Bildirişlər", icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#D90429] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "profile" && (
            <ProfileSettings user={user} onSave={handleSave} />
          )}
          {activeTab === "store" && store && (
            <StoreSettings store={store} products={products} onSave={handleSave} />
          )}
          {activeTab === "security" && (
            <SecuritySettings user={user} onSave={handleSave} />
          )}
          {activeTab === "notifications" && (
            <NotificationSettings user={user} onSave={handleSave} />
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

// Profile Settings
function ProfileSettings({ user, onSave }: { user: User; onSave: () => void }) {
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    username: user.username,
    email: user.email || "",
    phone: user.phone || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Update user in localStorage
    const users = JSON.parse(localStorage.getItem("decor_users") || "[]");
    const index = users.findIndex((u: User) => u.id === user.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...formData };
      localStorage.setItem("decor_users", JSON.stringify(users));
      
      // Update current user
      const currentUser = { ...user, ...formData };
      localStorage.setItem("decor_current_user", JSON.stringify(currentUser));
    }

    setLoading(false);
    onSave();
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <UserIcon className="w-5 h-5" />
        Profil Məlumatları
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Ad Soyad"
            value={formData.fullName}
            onChange={(value) => setFormData({ ...formData, fullName: value })}
            required
          />
          <Input
            label="İstifadəçi adı"
            value={formData.username}
            onChange={(value) => setFormData({ ...formData, username: value })}
            required
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData({ ...formData, email: value })}
          />
          <Input
            label="Telefon"
            value={formData.phone}
            onChange={(value) => setFormData({ ...formData, phone: value })}
          />
        </div>
        <div className="pt-4">
          <Button type="submit" loading={loading} icon={<Save className="w-4 h-4" />}>
            Yadda Saxla
          </Button>
        </div>
      </form>
    </Card>
  );
}

// Store Settings
function StoreSettings({
  store,
  products,
  onSave,
}: {
  store: VendorStore;
  products: VendorProduct[];
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: store.name,
    description: store.description,
    address: store.address,
    phone: store.phone,
    email: store.email,
    logo: store.logo,
    banner: store.banner,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    vendorStores.update(store.id, {
      ...formData,
      updatedAt: new Date().toISOString(),
    });

    setLoading(false);
    onSave();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Store className="w-5 h-5" />
          Mağaza Məlumatları
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo & Banner */}
          <div className="grid md:grid-cols-2 gap-6">
            <ImageUpload
              label="Mağaza Logosu"
              value={formData.logo}
              onChange={(logo) => setFormData({ ...formData, logo })}
              placeholder="Logo yüklə"
              aspectRatio="square"
            />
            <ImageUpload
              label="Mağaza Banneri"
              value={formData.banner}
              onChange={(banner) => setFormData({ ...formData, banner })}
              placeholder="Banner yüklə"
              aspectRatio="banner"
            />
          </div>

          <Input
            label="Mağaza Adı"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-2">Açıqlama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D90429] focus:border-transparent"
              rows={3}
              required
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Ünvan"
              value={formData.address}
              onChange={(value) => setFormData({ ...formData, address: value })}
              required
            />
            <Input
              label="Telefon"
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData({ ...formData, email: value })}
            required
          />
          <div className="pt-4">
            <Button type="submit" loading={loading} icon={<Save className="w-4 h-4" />}>
              Yadda Saxla
            </Button>
          </div>
        </form>
      </Card>

      {/* Store Stats */}
      <Card className="p-6">
        <h3 className="font-bold mb-4">Mağaza Statistikası</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-[#D90429]">{store.totalSales}</p>
            <p className="text-sm text-gray-500">Ümumi Satış</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-[#D90429]">{products.length}</p>
            <p className="text-sm text-gray-500">Məhsul Sayı</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-[#D90429]">{store.rating.toFixed(1)}</p>
            <p className="text-sm text-gray-500">Reytinq</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-[#D90429]">{store.reviewCount}</p>
            <p className="text-sm text-gray-500">Rəy Sayı</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Security Settings
function SecuritySettings({ user, onSave }: { user: User; onSave: () => void }) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Yeni şifrələr uyğun gəlmir");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Şifrə ən az 6 simvol olmalıdır");
      return;
    }

    setLoading(true);

    // Verify current password and update
    const users = JSON.parse(localStorage.getItem("decor_users") || "[]");
    const index = users.findIndex((u: User) => u.id === user.id);
    
    if (index !== -1) {
      if (users[index].password !== formData.currentPassword) {
        setError("Cari şifrə yanlışdır");
        setLoading(false);
        return;
      }

      users[index].password = formData.newPassword;
      localStorage.setItem("decor_users", JSON.stringify(users));
    }

    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setLoading(false);
    onSave();
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Lock className="w-5 h-5" />
        Şifrə Dəyişdir
      </h2>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <Input
          label="Cari Şifrə"
          type="password"
          value={formData.currentPassword}
          onChange={(value) => setFormData({ ...formData, currentPassword: value })}
          required
        />
        <Input
          label="Yeni Şifrə"
          type="password"
          value={formData.newPassword}
          onChange={(value) => setFormData({ ...formData, newPassword: value })}
          required
        />
        <Input
          label="Yeni Şifrə (Təkrar)"
          type="password"
          value={formData.confirmPassword}
          onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
          required
        />
        <div className="pt-4">
          <Button type="submit" loading={loading} icon={<Save className="w-4 h-4" />}>
            Şifrəni Yenilə
          </Button>
        </div>
      </form>
    </Card>
  );
}

// Notification Settings
function NotificationSettings({ user, onSave }: { user: User; onSave: () => void }) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    promotionalEmails: false,
  });

  const handleSave = () => {
    // Save notification preferences to localStorage
    localStorage.setItem(`decor_notifications_${user.id}`, JSON.stringify(settings));
    onSave();
  };

  useEffect(() => {
    // Load saved preferences
    const saved = localStorage.getItem(`decor_notifications_${user.id}`);
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, [user.id]);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Bell className="w-5 h-5" />
        Bildiriş Tənzimləmələri
      </h2>
      <div className="space-y-4">
        {[
          { id: "emailNotifications", label: "Email bildirişləri", icon: Mail },
          { id: "smsNotifications", label: "SMS bildirişləri", icon: Phone },
          { id: "orderUpdates", label: "Sifariş yeniləmələri", icon: Package },
          { id: "promotionalEmails", label: "Promosyon və təkliflər", icon: Bell },
        ].map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-gray-400" />
              <span>{item.label}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings[item.id as keyof typeof settings]}
                onChange={(e) =>
                  setSettings({ ...settings, [item.id]: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D90429]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D90429]"></div>
            </label>
          </div>
        ))}
        <div className="pt-4">
          <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>
            Yadda Saxla
          </Button>
        </div>
      </div>
    </Card>
  );
}
