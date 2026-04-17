"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Bell } from "lucide-react";
import Link from "next/link";

export function SupportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-50" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "80vh" }}>
            <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><MessageCircle className="w-5 h-5" /></div>
                <div><h3 className="font-semibold">Canlı Dəstək</h3><p className="text-sm text-white/80">Premium Reklam</p></div>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <p className="text-gray-600 mb-4">Salam! Sizə necə kömək edə bilərik?</p>
              <div className="space-y-3">
                <a href="https://wa.me/994507988177?text=Salam,+məlumat+almaq+istəyirəm" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white"><MessageCircle className="w-5 h-5" /></div>
                  <div><p className="font-medium text-[#1F2937]">WhatsApp ilə yazın</p><p className="text-sm text-[#6B7280]">Sürətli cavab</p></div>
                </a>
                <a href="tel:+994507988177" className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <div className="w-10 h-10 bg-[#D90429] rounded-full flex items-center justify-center text-white"><Bell className="w-5 h-5" /></div>
                  <div><p className="font-medium text-[#1F2937]">Zəng edin</p><p className="text-sm text-[#6B7280]">+994 50 798 81 77</p></div>
                </a>
                <Link href="/dashboard/support" onClick={onClose} className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <div className="w-10 h-10 bg-[#4F46E5] rounded-full flex items-center justify-center text-white"><MessageCircle className="w-5 h-5" /></div>
                  <div><p className="font-medium text-[#1F2937]">Mesaj göndərin</p><p className="text-sm text-[#6B7280]">Adminə birbaşa cavab</p></div>
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}