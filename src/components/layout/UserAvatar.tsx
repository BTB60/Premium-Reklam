import { User } from "lucide-react";

export function UserAvatar({ userName, variant, isAuth }: { userName?: string; variant: string; isAuth: boolean }) {
  const show = variant !== "public" || isAuth;
  if (!show) return null;

  return (
    <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-gray-200">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C41E3A] to-[#9A1529] flex items-center justify-center text-white shadow-sm">
        <User className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-[#0A0A0A]">{userName || "İstifadəçi"}</span>
    </div>
  );
}