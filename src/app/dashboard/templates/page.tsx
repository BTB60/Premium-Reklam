"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { auth, templates, type User, type OrderTemplate } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Copy, Trash2, ShoppingBag, FileText } from "lucide-react";
import Link from "next/link";

export default function TemplatesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userTemplates, setUserTemplates] = useState<OrderTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    setUserTemplates(templates.getByUserId(currentUser.id));
    setLoading(false);
  }, [router]);

  const handleDelete = (id: string) => {
    if (confirm("Şablonu silmək istədiyinizə əminsiniz?")) {
      templates.delete(id);
      setUserTemplates(userTemplates.filter((t) => t.id !== id));
    }
  };

  const handleUseTemplate = (template: OrderTemplate) => {
    // Store template in localStorage for new order page
    localStorage.setItem("selected_template", JSON.stringify(template));
    router.push("/orders/new");
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6"
          >
            <Link href="/dashboard">
              <Button variant="ghost" icon={<ArrowLeft className="w-5 h-5" />}>
                Geri
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-[#1F2937]">Sifariş Şablonlarım</h1>
          </motion.div>

          {userTemplates.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Hələ şablon yoxdur</p>
              <p className="text-sm text-gray-400 mb-4">
                Sifariş edərkən "Şablon kimi saxla" seçimi ilə şablon yarada bilərsiniz
              </p>
              <Link href="/orders/new">
                <Button icon={<ShoppingBag className="w-4 h-4" />}>Yeni Sifariş</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {userTemplates.map((template) => (
                <Card key={template.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{template.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {template.items.length} məhsul •{" "}
                        {new Date(template.createdAt).toLocaleDateString("az-AZ")}
                      </p>
                      <div className="mt-2 space-y-1">
                        {template.items.slice(0, 3).map((item, idx) => (
                          <p key={idx} className="text-sm text-gray-600">
                            • {item.productName}
                            {item.width && item.height
                              ? ` (${item.width}x${item.height} sm)`
                              : ""}
                            {" "}× {item.quantity}
                          </p>
                        ))}
                        {template.items.length > 3 && (
                          <p className="text-sm text-gray-400">
                            +{template.items.length - 3} daha...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleUseTemplate(template)}
                        icon={<Copy className="w-4 h-4" />}
                      >
                        İstifadə Et
                      </Button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
