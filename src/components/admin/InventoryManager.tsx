"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { inventory, type Material } from "@/lib/db";
import { Package, AlertTriangle, Plus, Trash2, RefreshCw } from "lucide-react";

interface InventoryManagerProps {
  materials: Material[];
}

export function InventoryManager({ materials }: InventoryManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [restocking, setRestocking] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "m²" as "m²" | "metr" | "kq" | "ədəd",
    quantity: "",
    minQuantity: "",
    unitPrice: "",
    supplier: "",
  });

  const lowStock = materials.filter((m) => m.quantity <= m.minQuantity);

  const handleCreate = () => {
    if (!formData.name || !formData.category) return;
    inventory.create({
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      quantity: parseFloat(formData.quantity) || 0,
      minQuantity: parseFloat(formData.minQuantity) || 10,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      supplier: formData.supplier,
    });
    setShowForm(false);
    window.location.reload();
  };

  const handleRestock = (id: string) => {
    if (!restockAmount) return;
    inventory.restock(id, parseFloat(restockAmount));
    setRestocking(null);
    setRestockAmount("");
    window.location.reload();
  };

  const handleDelete = (id: string) => {
    if (confirm("Materiallı silmək istədiyinizə əminsiniz?")) {
      inventory.delete(id);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Tükənmək üzrə olan materiallar</p>
              <p className="text-sm text-amber-600">
                {lowStock.map((m) => m.name).join(", ")}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Add Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
          Yeni Material
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="font-bold mb-4">Yeni Material</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="Material adı"
            />
            <Input
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              placeholder="Kateqoriya"
            />
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="m²">m²</option>
              <option value="metr">metr</option>
              <option value="kq">kq</option>
              <option value="ədəd">ədəd</option>
            </select>
            <Input
              type="number"
              value={formData.quantity}
              onChange={(value) => setFormData({ ...formData, quantity: value })}
              placeholder="Miqdar"
            />
            <Input
              type="number"
              value={formData.minQuantity}
              onChange={(value) => setFormData({ ...formData, minQuantity: value })}
              placeholder="Min. miqdar"
            />
            <Input
              type="number"
              value={formData.unitPrice}
              onChange={(value) => setFormData({ ...formData, unitPrice: value })}
              placeholder="Vahid qiymət"
            />
            <Input
              value={formData.supplier}
              onChange={(value) => setFormData({ ...formData, supplier: value })}
              placeholder="Təchizatçı"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate}>Yadda Saxla</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Ləğv Et</Button>
          </div>
        </Card>
      )}

      {/* Materials List */}
      <div className="grid gap-4">
        {materials.map((material) => (
          <Card key={material.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    material.quantity <= material.minQuantity
                      ? "bg-red-100"
                      : "bg-emerald-100"
                  }`}
                >
                  <Package
                    className={`w-5 h-5 ${
                      material.quantity <= material.minQuantity
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  />
                </div>
                <div>
                  <p className="font-bold">{material.name}</p>
                  <p className="text-sm text-gray-500">
                    {material.category} • {material.supplier}
                  </p>
                  <p className="text-sm">
                    <span
                      className={
                        material.quantity <= material.minQuantity
                          ? "text-red-600 font-bold"
                          : "text-emerald-600"
                      }
                    >
                      {material.quantity} {material.unit}
                    </span>
                    {" "}
                    <span className="text-gray-400">/ min: {material.minQuantity}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {restocking === material.id ? (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={restockAmount}
                      onChange={(value) => setRestockAmount(value)}
                      placeholder="Miqdar"
                      className="w-24"
                    />
                    <Button onClick={() => handleRestock(material.id)}>+</Button>
                    <Button variant="ghost" onClick={() => setRestocking(null)}>✕</Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => setRestocking(material.id)}
                      icon={<RefreshCw className="w-4 h-4" />}
                    >
                      Əlavə Et
                    </Button>
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
