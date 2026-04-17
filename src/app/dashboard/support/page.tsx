"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  send, getConversation, markAllAsRead, validateFile, fileToBase64,
  MAX_FILE_SIZE, type SupportMessage, type SupportAttachment 
} from "@/lib/db/messages";
import { auth, type User } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Send, Paperclip, X, Image as ImageIcon, Video } from "lucide-react";
import Link from "next/link";

const ADMIN_ID = "admin-1";
const ADMIN_NAME = "Admin Dəstək";

export default function SupportPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachment, setAttachment] = useState<SupportAttachment | null>(null);
  const [attachmentError, setAttachmentError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка пользователя и сообщений
  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    loadMessages(currentUser.id);
    setLoading(false);

    // Пометить все как прочитанные при входе в чат
    markAllAsRead(currentUser.id);

    // Polling для новых сообщений (каждые 3 сек)
    const interval = setInterval(() => {
      if (currentUser?.id) loadMessages(currentUser.id);
    }, 3000);

    // Слушатель для кросс-таб синхронизации
    const onStorage = (e: StorageEvent) => {
      if (e.key === "decor_support_messages" && currentUser?.id) {
        loadMessages(currentUser.id);
      }
    };
    window.addEventListener("storage", onStorage);
    
    // Custom event для intra-tab
    const onCustom = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.key === "decor_support_messages" && currentUser?.id) {
        loadMessages(currentUser.id);
      }
    };
    window.addEventListener("storage:decor_support_messages", onCustom as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("storage:decor_support_messages", onCustom as EventListener);
    };
  }, [router]);

  // Авто-скролл вниз при новых сообщениях
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const loadMessages = (userId: string) => {
    const conversation = getConversation(userId, ADMIN_ID);
    setChatMessages(conversation);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Обработка выбора файла
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setAttachmentError(validation.error || "Fayl seçimi xətası");
      return;
    }

    setAttachmentError("");
    setSending(true);
    
    try {
      const base64 = await fileToBase64(file);
      setAttachment({
        type: file.type.startsWith("image/") ? "image" : "video",
        url: base64,
        size: file.size,
        name: file.name,
        mimeType: file.type,
      });
    } catch (err) {
      setAttachmentError("Fayl yüklənərkən xəta baş verdi");
      console.error("File conversion error:", err);
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Отправка сообщения
  const handleSendMessage = async () => {
    if (!user || (!newMessage.trim() && !attachment)) return;

    setSending(true);
    try {
      await send(
        user.id,
        user.role as "DECORATOR",
        ADMIN_ID,
        newMessage.trim(),
        attachment || undefined
      );
      setNewMessage("");
      setAttachment(null);
      loadMessages(user.id);
    } catch (err) {
      console.error("Send error:", err);
      setAttachmentError("Mesaj göndərilərkən xəta baş verdi");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentError("");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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
          {/* Заголовок */}
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
            <h1 className="text-2xl font-bold text-[#1F2937]">Dəstək Mərkəzi</h1>
          </motion.div>

          {/* Чат-карточка */}
          <Card className="h-[calc(100vh-220px)] flex flex-col overflow-hidden">
            
            {/* Хедер чата */}
            <div className="p-4 border-b flex items-center gap-3 bg-gray-50">
              <div className="w-10 h-10 bg-[#D90429] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">AD</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[#1F2937] truncate">{ADMIN_NAME}</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Onlayn
                </p>
              </div>
            </div>

            {/* Область сообщений */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              <AnimatePresence>
                {chatMessages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">👋</span>
                    </div>
                    <p className="text-gray-600 font-medium">Sualınız var?</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Mesaj yazın, admin tezliklə cavab verəcək
                    </p>
                  </motion.div>
                ) : (
                  chatMessages.map((msg) => {
                    const isOwn = msg.senderId === user.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[85%] sm:max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
                          {/* Пузырь сообщения */}
                          <div
                            className={`p-3 rounded-2xl ${
                              isOwn
                                ? "bg-[#D90429] text-white rounded-br-md"
                                : "bg-gray-100 text-gray-800 rounded-bl-md"
                            }`}
                          >
                            {/* Текст */}
                            {msg.content && (
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                            
                            {/* Вложение */}
                            {msg.attachment && (
                              <div className="mt-2">
                                {msg.attachment.type === "image" ? (
                                  <img
                                    src={msg.attachment.url}
                                    alt={msg.attachment.name}
                                    className="max-w-full rounded-lg border border-white/20"
                                  />
                                ) : (
                                  <div className="relative bg-black/10 rounded-lg p-3 flex items-center gap-2">
                                    <Video className={`w-5 h-5 ${isOwn ? "text-white" : "text-gray-600"}`} />
                                    <span className={`text-sm truncate ${isOwn ? "text-white/90" : "text-gray-700"}`}>
                                      {msg.attachment.name}
                                    </span>
                                  </div>
                                )}
                                <p className={`text-[10px] mt-1 ${isOwn ? "text-white/60" : "text-gray-400"}`}>
                                  {formatFileSize(msg.attachment.size)}
                                </p>
                              </div>
                            )}
                            
                            {/* Время */}
                            <p
                              className={`text-[10px] mt-1 text-right ${
                                isOwn ? "text-white/70" : "text-gray-400"
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString("az-AZ", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Область ввода */}
            <div className="p-4 border-t bg-gray-50">
              
              {/* Превью вложения */}
              <AnimatePresence>
                {attachment && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 p-3 bg-white rounded-lg border flex items-start gap-3"
                  >
                    {attachment.type === "image" ? (
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Video className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{attachment.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeAttachment}
                      icon={<X className="w-4 h-4" />}
                      className="text-gray-400 hover:text-red-500"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Ошибка вложения */}
              {attachmentError && (
                <p className="text-xs text-red-500 mb-2">{attachmentError}</p>
              )}

              {/* Поле ввода + кнопки */}
              <div className="flex items-end gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*"
                  className="hidden"
                />
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                  className="text-gray-500 hover:text-[#D90429] flex-shrink-0"
                  icon={<Paperclip className="w-5 h-5" />}
                />
                
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#D90429]/20 focus:border-[#D90429] transition-all min-h-[44px] max-h-32"
                  rows={1}
                  disabled={sending}
                />
                
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || (!newMessage.trim() && !attachment)}
                  icon={sending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  className="bg-[#D90429] hover:bg-[#C41E3A] text-white flex-shrink-0"
                >
                  {!sending && <span className="hidden sm:inline">Göndər</span>}
                </Button>
              </div>
              
              {/* Подсказка */}
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                Şəkil və ya video əlavə edə bilərsiniz (maks. 4MB)
              </p>
            </div>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}