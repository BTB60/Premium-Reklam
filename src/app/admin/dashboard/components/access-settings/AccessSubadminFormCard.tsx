"use client";

import type { Dispatch, SetStateAction } from "react";
import { Edit, Plus, Save, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FEATURES } from "./constants";
import { PermissionToggle } from "./PermissionToggle";
import type { SubadminFormState } from "./types";

export function AccessSubadminFormCard({
  editingId,
  formData,
  setFormData,
  onSubmit,
  onCancel,
}: {
  editingId: string | null;
  formData: SubadminFormState;
  setFormData: Dispatch<SetStateAction<SubadminFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <Card className="p-6 mb-6 border-2 border-[#D90429]">
      <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
        {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        {editingId ? "Redaktə" : "Yeni Subadmin Yarat"}
      </h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Login</label>
            <input
              type="text"
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-1">Parol</label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6B7280] mb-2">İcazələr</label>
          <div className="grid md:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-[#1F2937]">{f.label}</span>
                <PermissionToggle
                  value={formData.permissions[f.key]}
                  onChange={(v) =>
                    setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, [f.key]: v },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" icon={<Save className="w-4 h-4" />}>
            Yadda saxla
          </Button>
          <Button variant="ghost" onClick={onCancel} icon={<X className="w-4 h-4" />}>
            Ləğv et
          </Button>
        </div>
      </form>
    </Card>
  );
}
