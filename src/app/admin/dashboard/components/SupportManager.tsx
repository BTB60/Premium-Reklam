"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  send,
  markAsRead,
  type SupportMessage,
} from "@/lib/db/messages";
import { type User as AppUser } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Search, Send, Paperclip, X, ArrowLeft, Headphones,
  Video, Wifi,
} from "lucide-react";

interface ConversationSummary {
  userId: string;
  userFullName: string;
  userUsername: string;
  userPhone?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: "aktiv" | "həll olundu";
}

const ADMIN_ID = "admin-1";
const ADMIN_ROLE: "ADMIN" = "ADMIN";

export default function SupportManager() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachment, setAttachment] = useState<SupportMessage["attachment"] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "aktiv" | "həll olundu">("all");
  const [sending, setSending] = useState(false);
  const [pollCounter, setPollCounter] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ✅ Ref для доступа к ID открытого чата внутри интервала без зависимостей
  const selectedUserIdRef = useRef<string | null>(null);

  // Синхронизация Ref с состоянием
  useEffect(() => {
    selectedUserIdRef.current = selectedConversation?.userId || null;
  }, [selectedConversation]);

  // 🔥 ЖЕСТКИЙ ПОЛЛИНГ: 500мс, независим от React-цикла, никогда не сбрасывается
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (typeof window === "undefined") return;
      
      setPollCounter(c => c + 1);
      
      try {
        const raw = localStorage.getItem("decor_support_messages") || "[]";
        const allMessages: SupportMessage[] = JSON.parse(raw);
        
        // 1. Обновляем список чатов
        const grouped = new Map<string, SupportMessage[]>();
        allMessages.forEach(msg => {
          const convId = msg.conversationId;
          if (!grouped.has(convId)) grouped.set(convId, []);
          grouped.get(convId)!.push(msg);
        });

        const usersRaw = localStorage.getItem("decor_users");
        const users: AppUser[] = usersRaw ? JSON.parse(usersRaw) : [];

        const summaries: ConversationSummary[] = [];
        grouped.forEach((messages, userId) => {
          if (messages.every(m => m.senderRole === "ADMIN")) return;
          
          const user = users.find(u => u.id === userId);
          const sorted = [...messages].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          const lastMsg = sorted[sorted.length - 1];
          const unreadCount = sorted.filter(m => m.senderRole !== "ADMIN" && !m.read).length;
          const storedStatus = localStorage.getItem(`support_status_${userId}`) as "aktiv" | "həll olundu" || "aktiv";

          summaries.push({
            userId,
            userFullName: user?.fullName || "Naməlum İstifadəçi",
            userUsername: user?.username || "unknown",
            userPhone: user?.phone,
            lastMessage: lastMsg?.attachment 
              ? `📎 ${lastMsg.attachment.type === "image" ? "Şəkil" : "Video"}` 
              : (lastMsg?.content?.slice(0, 50) || ""),
            lastMessageAt: lastMsg?.createdAt || new Date().toISOString(),
            unreadCount,
            status: storedStatus,
          });
        });

        summaries.sort((a, b) => {
          if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
          if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        });

        setConversations(summaries);

        // 2. Если чат открыт, обновляем сообщения внутри него
        const activeId = selectedUserIdRef.current;
        if (activeId) {
          const chatMsgs = allMessages
            .filter(m => m.conversationId === activeId)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          
          setChatMessages(chatMsgs);

          // Авто-пометка прочитанными
          chatMsgs.forEach(msg => {
            if (!msg.read && msg.senderRole !== "ADMIN") {
              // Вызываем markAsRead напрямую, но аккуратно, чтобы не триггерить лишний рендер
              if (typeof window !== "undefined") {
                const stored = localStorage.getItem("decor_support_messages");
                if (stored) {
                  const parsed: SupportMessage[] = JSON.parse(stored);
                  const target = parsed.find(p => p.id === msg.id);
                  if (target && !target.read) {
                    target.read = true;
                    localStorage.setItem("decor_support_messages", JSON.stringify(parsed));
                  }
                }
              }
            }
          });
        }
      } catch (err) {
        console.error("[SupportManager] 500ms poll error:", err);
      }
    }, 500); // ✅ Ровно 500 мс

    return () => clearInterval(intervalId);
  }, []); // ✅ ПУСТОЙ МАССИВ: запускается 1 раз и работает вечно

  // Автоскролл
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ===== ОБРАБОТЧИКИ =====
  const handleSelectConversation = (conv: ConversationSummary) => setSelectedConversation(conv);
  const handleBackToList = () => { setSelectedConversation(null); setChatMessages([]); setNewMessage(""); setAttachment(null); };

  const handleStatusChange = (userId: string, newStatus: "aktiv" | "həll olundu") => {
    localStorage.setItem(`support_status_${userId}`, newStatus);
    setConversations(prev => prev.map(c => c.userId === userId ? { ...c, status: newStatus } : c));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { alert("Fayl ölçüsü 4MB-dan çox olmamalıdır"); return; }
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) { alert("Yalnız şəkil və ya video fayllar qəbul edilir"); return; }
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setAttachment({ type: file.type.startsWith("image/") ? "image" : "video", url: base64, size: file.size, name: file.name, mimeType: file.type });
    } catch (err) { console.error("File error:", err); alert("Fayl yüklənərkən xəta baş verdi"); }
    finally { if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || (!newMessage.trim() && !attachment)) return;
    setSending(true);
    try {
      await send(ADMIN_ID, ADMIN_ROLE, selectedConversation.userId, newMessage.trim(), attachment || undefined);
      setNewMessage(""); setAttachment(null);
      // Мгновенное обновление после отправки
      const raw = localStorage.getItem("decor_support_messages") || "[]";
      const msgs: SupportMessage[] = JSON.parse(raw).filter(m => m.conversationId === selectedConversation.userId);
      setChatMessages(msgs.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch (err) { console.error("Send error:", err); alert("Mesaj göndərilərkən xəta baş verdi"); }
    finally { setSending(false); }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };
  const removeAttachment = () => setAttachment(null);
  const formatFileSize = (b: number) => b < 1024 ? b + " B" : b < 1048576 ? (b/1024).toFixed(1) + " KB" : (b/1048576).toFixed(1) + " MB";
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });

  const filteredConversations = conversations.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.userFullName.toLowerCase().includes(q) && !c.userUsername.toLowerCase().includes(q) && !c.userPhone?.toLowerCase().includes(q) && !c.lastMessage.toLowerCase().includes(q)) return false;
    }
    return statusFilter === "all" || c.status === statusFilter;
  });

  const stats = { total: conversations.length, aktiv: conversations.filter(c => c.status === "aktiv").length, həll: conversations.filter(c => c.status === "həll olundu").length, unread: conversations.reduce((s,c) => s+c.unreadCount, 0) };

  // === Режим чата ===
  if (selectedConversation) {
    return (
      <Card className="h-[calc(100vh-180px)] flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={handleBackToList} className="flex-shrink-0"><ArrowLeft className="w-5 h-5" /></Button>
            <div className="min-w-0">
              <p className="font-bold text-[#1F2937] truncate">{selectedConversation.userFullName}</p>
              <p className="text-xs text-[#6B7280]">@{selectedConversation.userUsername}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Status:</span>
            <select value={selectedConversation.status} onChange={(e) => handleStatusChange(selectedConversation.userId, e.target.value as any)} onClick={(e) => e.stopPropagation()} className={`text-xs px-3 py-1.5 rounded-full border font-medium ${selectedConversation.status === "aktiv" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              <option value="aktiv">Aktiv</option>
              <option value="həll olundu">Həll olundu</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          <AnimatePresence>
            {chatMessages.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Headphones className="w-8 h-8 text-gray-400" /></div>
                <p className="text-gray-500">Bu çatda hələ mesaj yoxdur</p>
              </motion.div>
            ) : chatMessages.map(msg => {
              const isOwn = msg.senderRole === "ADMIN";
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${isOwn ? "order-2" : "order-1"}`}>
                    {!isOwn && <div className="w-8 h-8 bg-[#D90429] rounded-full flex items-center justify-center mb-1"><span className="text-white text-xs font-bold">{selectedConversation.userFullName.charAt(0).toUpperCase()}</span></div>}
                    <div className={`p-3 rounded-2xl ${isOwn ? "bg-[#D90429] text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"}`}>
                      {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                      {msg.attachment && <div className="mt-2">{msg.attachment.type === "image" ? <img src={msg.attachment.url} alt={msg.attachment.name} className="max-w-full rounded-lg" /> : <div className="bg-black/10 rounded-lg p-3 flex items-center gap-2"><Video className="w-5 h-5" /><span className="text-sm truncate">{msg.attachment.name}</span></div>}<p className={`text-[10px] mt-1 ${isOwn ? "text-white/60" : "text-gray-400"}`}>{formatFileSize(msg.attachment.size)}</p></div>}
                      <p className={`text-[10px] mt-1 text-right ${isOwn ? "text-white/70" : "text-gray-400"}`}>{formatTime(msg.createdAt)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-gray-50">
          {attachment && <div className="mb-3 p-3 bg-white rounded-lg border flex items-start gap-3">{attachment.type === "image" ? <img src={attachment.url} className="w-16 h-16 object-cover rounded" /> : <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center"><Video className="w-6 h-6 text-gray-500" /></div>}<div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{attachment.name}</p><p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p></div><Button variant="ghost" size="sm" onClick={removeAttachment} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></Button></div>}
          <div className="flex items-end gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={sending} className="text-gray-500 hover:text-[#D90429]"><Paperclip className="w-5 h-5" /></Button>
            <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyPress} placeholder="Cavabınızı yazın..." className="flex-1 px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#D90429]/20 min-h-[44px] max-h-32" rows={1} disabled={sending} />
            <Button onClick={handleSendMessage} disabled={sending || (!newMessage.trim() && !attachment)} className="bg-[#D90429] hover:bg-[#C41E3A] text-white">{sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}</Button>
          </div>
        </div>
      </Card>
    );
  }

  // === Режим списка ===
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Headphones className="w-8 h-8 text-[#D90429]" />
          <h1 className="text-2xl font-bold text-[#1F2937]">Dəstək Mərkəzi</h1>
          <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200 flex items-center gap-1">
            <Wifi className="w-3 h-3 animate-pulse" /> Poll: 500ms | #{pollCounter}
          </span>
        </div>
        <div className="text-sm text-[#6B7280]">Ümumi: <span className="font-bold">{stats.total}</span> • Aktiv: <span className="font-bold text-green-600">{stats.aktiv}</span> • Həll: <span className="font-bold text-gray-500">{stats.həll}</span> • Oxunmamış: <span className="font-bold text-red-600">{stats.unread}</span></div>
      </div>
      
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Axtar: ad, istifadəçi adı, telefon..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#D90429]">
            <option value="all">Bütün statuslar</option>
            <option value="aktiv">Aktiv</option>
            <option value="həll olundu">Həll olundu</option>
          </select>
        </div>
      </Card>

      <div className="space-y-3">
        <AnimatePresence>
          {filteredConversations.length === 0 ? (
            <Card className="p-12 text-center text-[#6B7280]">Müraciət tapılmadı</Card>
          ) : filteredConversations.map(conv => (
            <motion.div key={conv.userId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className={`p-4 cursor-pointer transition-all hover:shadow-md ${selectedConversation?.userId === conv.userId ? "ring-2 ring-[#D90429]" : ""}`} onClick={() => handleSelectConversation(conv)}>
                <div className="flex items-start gap-4">
                  {conv.unreadCount > 0 && <div className="relative flex-shrink-0"><div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" /><div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" /></div>}
                  <div className="w-12 h-12 bg-gradient-to-br from-[#D90429] to-[#EF476F] rounded-full flex items-center justify-center flex-shrink-0"><span className="text-white font-bold text-lg">{conv.userFullName.charAt(0).toUpperCase()}</span></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-[#1F2937] truncate">{conv.userFullName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conv.status === "aktiv" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{conv.status === "aktiv" ? "Aktiv" : "Həll"}</span>
                    </div>
                    <p className="text-xs text-[#6B7280]">@{conv.userUsername} {conv.userPhone && `• ${conv.userPhone}`}</p>
                    <p className={`text-sm mt-1 truncate ${conv.unreadCount > 0 ? "font-medium text-[#1F2937]" : "text-[#6B7280]"}`}>{conv.lastMessage || "Mesaj yoxdur"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-[#6B7280]">{formatTime(conv.lastMessageAt)}</p>
                    {conv.unreadCount > 0 && <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full mt-1">{conv.unreadCount > 9 ? "9+" : conv.unreadCount}</span>}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}