"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { favorites, products, type Favorite } from "@/lib/db";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";

interface FavoritesListProps {
  favorites: Favorite[];
  userId: string;
}

export function FavoritesList({ favorites: userFavorites, userId }: FavoritesListProps) {
  const handleRemove = (productId: string) => {
    favorites.remove(userId, productId);
    window.location.reload();
  };

  const handleAddToOrder = (favorite: Favorite) => {
    // Store in localStorage for quick order
    const quickOrder = {
      productId: favorite.productId,
      productName: favorite.productName,
      quantity: 1,
    };
    localStorage.setItem("quick_order_item", JSON.stringify(quickOrder));
    window.location.href = "/orders/new";
  };

  return (
    <div className="space-y-4">
      {userFavorites.length === 0 ? (
        <Card className="p-8 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Hələ favori yoxdur</p>
          <p className="text-sm text-gray-400 mb-4">
            Məhsulları bəyənərək siyahıya əlavə edin
          </p>
          <Link href="/dashboard/products">
            <Button icon={<ShoppingBag className="w-4 h-4" />}>
              Məhsullara bax
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {userFavorites.map((fav) => (
            <Card key={fav.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">{fav.productName}</h3>
                  <p className="text-lg text-[#D90429] font-bold mt-1">
                    {fav.productPrice.toFixed(2)} AZN
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(fav.createdAt).toLocaleDateString("az-AZ")} əlavə edildi
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleAddToOrder(fav)}
                    icon={<ShoppingBag className="w-4 h-4" />}
                  >
                    Sifariş et
                  </Button>
                  <button
                    onClick={() => handleRemove(fav.productId)}
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
  );
}
