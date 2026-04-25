"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { authApi } from "@/lib/authApi";
import {
  fileToBase64NoPrefix,
  supportChatFetchMessages,
  supportChatSendMessage,
  SUPPORT_MAX_ATTACHMENT_BYTES,
  type SupportChatMessageDto,
} from "@/lib/supportChatApi";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Send, Headphones, ImagePlus, Video, Loader2, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import {
  playSupportChatNotificationSound,
  readSupportChatSoundEnabled,
  writeSupportChatSoundEnabled,
} from "@/lib/notificationSound";
import { markAllSupportNotificationsAsRead } from "@/lib/db/messages";

function mediaSrc(m: SupportChatMessageDto): string | null {
  if (!m.attachmentBase64 || !m.attachmentMimeType) return null;
  return `data:${m.attachmentMimeType};base64,${m.attachmentBase64}`;
}

export default function SupportPage() {
  const router = useRouter();
  const [chatMessages, setChatMessages] = useState<SupportChatMessageDto[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastKnownMaxMsgIdRef = useRef<number | null>(null);
  const [supportSoundOn, setSupportSoundOn] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await supportChatFetchMessages();
      setChatMessages(list);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Mesajlar yüklənmədi");
    }
  }, []);

  useEffect(() => {
    const user = authApi.getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const role = String(user.role || "").toUpperCase();
    if (role === "ADMIN" || role === "SUBADMIN") {
      router.push("/admin/dashboard");
      return;
    }

    markAllSupportNotificationsAsRead(String(user.id));
    window.dispatchEvent(new Event("premium:local-notifications-changed"));

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await supportChatFetchMessages();
        if (!cancelled) {
          setChatMessages(list);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Mesajlar yüklənmədi");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const interval = setInterval(() => {
      void refresh();
    }, 4000);

    const onSupportPush = () => void refresh();
    window.addEventListener("premium:support-chat-refresh", onSupportPush);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("premium:support-chat-refresh", onSupportPush);
    };
  }, [router, refresh]);

  useEffect(() => {
    setSupportSoundOn(readSupportChatSoundEnabled("user"));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (loading || chatMessages.length === 0) {
      if (chatMessages.length === 0) lastKnownMaxMsgIdRef.current = null;
      return;
    }
    const maxId = Math.max(...chatMessages.map((m) => m.id));
    const prev = lastKnownMaxMsgIdRef.current;
    if (prev === null) {
      lastKnownMaxMsgIdRef.current = maxId;
      return;
    }
    const adminArrived = chatMessages.some(
      (m) => m.id > prev && m.senderRole === "ADMIN"
    );
    lastKnownMaxMsgIdRef.current = maxId;
    if (adminArrived) playSupportChatNotificationSound("user");
  }, [chatMessages, loading, supportSoundOn]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      alert("Yalnız şəkil və ya video əlavə edə bilərsiniz");
      return;
    }
    if (f.size > SUPPORT_MAX_ATTACHMENT_BYTES) {
      alert("Fayl ölçüsü ən çox 4 MB ola bilər");
      return;
    }
    setPendingFile(f);
  };

  const handleSendMessage = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed && !pendingFile) return;

    let attachmentBase64: string | undefined;
    let attachmentMimeType: string | undefined;
    let attachmentFileName: string | undefined;
    if (pendingFile) {
      if (pendingFile.size > SUPPORT_MAX_ATTACHMENT_BYTES) {
        alert("Fayl ölçüsü ən çox 4 MB ola bilər");
        return;
      }
      attachmentBase64 = await fileToBase64NoPrefix(pendingFile);
      attachmentMimeType = pendingFile.type;
      attachmentFileName = pendingFile.name;
    }

    setSending(true);
    try {
      await supportChatSendMessage({
        content: trimmed,
        attachmentBase64,
        attachmentMimeType,
        attachmentFileName,
      });
      setNewMessage("");
      setPendingFile(null);
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Göndərilmədi");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D90429]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Header />

      <main className="pt-20 pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-3 mb-6"
          >
            <Link href="/dashboard">
              <Button variant="ghost" icon={<ArrowLeft className="w-5 h-5" />}>
                Geri
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-[#1F2937] flex-1 min-w-[10rem]">Dəstək Mərkəzi</h1>
            <button
              type="button"
              onClick={() => {
                const next = !supportSoundOn;
                setSupportSoundOn(next);
                writeSupportChatSoundEnabled("user", next);
              }}
              className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#1F2937] border border-gray-200 rounded-lg px-3 py-2 bg-white"
              title={supportSoundOn ? "Mesaj səsini söndür" : "Mesaj səsini aç"}
            >
              {supportSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{supportSoundOn ? "Səs açıq" : "Səs söndürülüb"}</span>
            </button>
          </motion.div>

          {loadError && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {loadError}
            </div>
          )}

          <Card className="h-[calc(100vh-200px)] flex flex-col">
            <div className="p-4 border-b flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D90429] rounded-full flex items-center justify-center">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold">Admin dəstəyi</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Canlı mesajlar serverə yazılır
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Headphones className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Dəstək ilə əlaqə saxlayın</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Mətn yazın və ya 4 MB-a qədər şəkil/video əlavə edin.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isOwn = msg.senderRole === "USER";
                  const src = mediaSrc(msg);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl ${
                          isOwn
                            ? "bg-[#D90429] text-white rounded-br-none"
                            : "bg-gray-100 text-gray-800 rounded-bl-none"
                        }`}
                      >
                        {msg.content ? (
                          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        ) : null}
                        {src && msg.attachmentMimeType?.startsWith("video/") ? (
                          <video
                            src={src}
                            controls
                            className="mt-2 max-w-full rounded-lg max-h-56"
                          />
                        ) : null}
                        {src && msg.attachmentMimeType?.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={src}
                            alt=""
                            className="mt-2 max-w-full rounded-lg max-h-56 object-contain"
                          />
                        ) : null}
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? "text-white/70" : "text-gray-500"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString("az-AZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t space-y-2">
              {pendingFile && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  {pendingFile.type.startsWith("video/") ? (
                    <Video className="w-4 h-4 shrink-0" />
                  ) : (
                    <ImagePlus className="w-4 h-4 shrink-0" />
                  )}
                  <span className="truncate flex-1">{pendingFile.name}</span>
                  <button
                    type="button"
                    className="text-red-600 shrink-0"
                    onClick={() => setPendingFile(null)}
                  >
                    Ləğv
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={onPickFile}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="shrink-0 px-2"
                  onClick={() => fileRef.current?.click()}
                  icon={<ImagePlus className="w-4 h-4" />}
                />
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 px-4 py-2 border rounded-lg resize-none text-sm"
                  rows={2}
                />
                <Button
                  onClick={() => void handleSendMessage()}
                  disabled={sending || (!newMessage.trim() && !pendingFile)}
                  icon={
                    sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )
                  }
                >
                  Göndər
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
