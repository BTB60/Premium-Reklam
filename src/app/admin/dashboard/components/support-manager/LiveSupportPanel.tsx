"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  adminSupportChatFetchMessages,
  adminSupportChatFetchThreads,
  adminSupportChatSendMessage,
  type SupportThreadSummaryDto,
} from "@/lib/adminSupportChatApi";
import {
  fileToBase64NoPrefix,
  SUPPORT_MAX_ATTACHMENT_BYTES,
  type SupportChatMessageDto,
} from "@/lib/supportChatApi";
import { Headphones, ImagePlus, Loader2, Send, Video } from "lucide-react";
import { playPremiumNotificationSound } from "@/lib/notificationSound";

function mediaSrc(m: SupportChatMessageDto): string | null {
  if (!m.attachmentBase64 || !m.attachmentMimeType) return null;
  return `data:${m.attachmentMimeType};base64,${m.attachmentBase64}`;
}

export function LiveSupportPanel() {
  const [threads, setThreads] = useState<SupportThreadSummaryDto[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<SupportChatMessageDto[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastKnownMaxMsgIdRef = useRef<number | null>(null);
  const prevSelectedUserIdRef = useRef<number | null>(null);

  const loadThreads = useCallback(async () => {
    try {
      const list = await adminSupportChatFetchThreads();
      setThreads(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Siyahı yüklənmədi");
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  const loadMessages = useCallback(async (userId: number) => {
    setLoadingMessages(true);
    try {
      const list = await adminSupportChatFetchMessages(userId);
      setMessages(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mesajlar yüklənmədi");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
    const t = setInterval(loadThreads, 5000);
    return () => clearInterval(t);
  }, [loadThreads]);

  useEffect(() => {
    const onPush = () => void loadThreads();
    window.addEventListener("premium:support-admin-refresh", onPush);
    return () => window.removeEventListener("premium:support-admin-refresh", onPush);
  }, [loadThreads]);

  useEffect(() => {
    if (selectedUserId == null) return;
    loadMessages(selectedUserId);
    const t = setInterval(() => loadMessages(selectedUserId), 3000);
    return () => clearInterval(t);
  }, [selectedUserId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedUserId !== prevSelectedUserIdRef.current) {
      prevSelectedUserIdRef.current = selectedUserId;
      lastKnownMaxMsgIdRef.current = null;
    }
    if (selectedUserId == null) return;
    const threadMessages = messages.filter((m) => m.userId === selectedUserId);
    if (threadMessages.length === 0) return;
    const maxId = Math.max(...threadMessages.map((m) => m.id));
    const prev = lastKnownMaxMsgIdRef.current;
    if (prev === null) {
      lastKnownMaxMsgIdRef.current = maxId;
      return;
    }
    const userArrived = threadMessages.some(
      (m) => m.id > prev && m.senderRole === "USER"
    );
    lastKnownMaxMsgIdRef.current = maxId;
    if (userArrived) playPremiumNotificationSound();
  }, [messages, selectedUserId]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      alert("Yalnız şəkil və ya video seçin");
      return;
    }
    if (f.size > SUPPORT_MAX_ATTACHMENT_BYTES) {
      alert("Fayl 4 MB-dan böyük ola bilməz");
      return;
    }
    setPendingFile(f);
  };

  const handleSend = async () => {
    if (selectedUserId == null) return;
    const trimmed = text.trim();
    if (!trimmed && !pendingFile) return;

    let attachmentBase64: string | undefined;
    let attachmentMimeType: string | undefined;
    let attachmentFileName: string | undefined;
    if (pendingFile) {
      if (pendingFile.size > SUPPORT_MAX_ATTACHMENT_BYTES) {
        alert("Fayl 4 MB-dan böyük ola bilməz");
        return;
      }
      attachmentBase64 = await fileToBase64NoPrefix(pendingFile);
      attachmentMimeType = pendingFile.type;
      attachmentFileName = pendingFile.name;
    }

    setSending(true);
    try {
      await adminSupportChatSendMessage(selectedUserId, {
        content: trimmed,
        attachmentBase64,
        attachmentMimeType,
        attachmentFileName,
      });
      setText("");
      setPendingFile(null);
      await loadMessages(selectedUserId);
      await loadThreads();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Göndərilmədi");
    } finally {
      setSending(false);
    }
  };

  const selectedThread = threads.find((t) => t.userId === selectedUserId);

  if (loadingThreads && threads.length === 0) {
    return (
      <Card className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D90429]" />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
      <Card className="p-0 overflow-hidden lg:col-span-1">
        <div className="p-3 border-b bg-gray-50 font-semibold text-sm flex items-center gap-2">
          <Headphones className="w-4 h-4 text-[#D90429]" />
          Canlı söhbətlər
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          {threads.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Hələ mesaj yoxdur</p>
          ) : (
            threads.map((th) => (
              <button
                key={th.userId}
                type="button"
                onClick={() => setSelectedUserId(th.userId)}
                className={`w-full text-left px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition ${
                  selectedUserId === th.userId ? "bg-red-50" : ""
                }`}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-sm truncate">
                    {th.fullName || th.username || `ID ${th.userId}`}
                  </span>
                  {th.unreadForAdmin > 0 && (
                    <span className="shrink-0 text-xs bg-[#D90429] text-white rounded-full px-2 py-0.5">
                      {th.unreadForAdmin}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{th.lastPreview}</p>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="p-0 flex flex-col lg:col-span-2 min-h-[480px]">
        {selectedUserId == null ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-8">
            Söhbət seçin
          </div>
        ) : (
          <>
            <div className="p-3 border-b flex items-center justify-between bg-gray-50">
              <div>
                <p className="font-semibold text-sm">
                  {selectedThread?.fullName || `İstifadəçi #${selectedUserId}`}
                </p>
                <p className="text-xs text-gray-500">@{selectedThread?.username || "—"}</p>
              </div>
              {loadingMessages && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            </div>

            {error && (
              <div className="mx-3 mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#f8f9fb] min-h-[300px]">
              {messages.map((m) => {
                const fromAdmin = m.senderRole === "ADMIN";
                const src = mediaSrc(m);
                return (
                  <div key={m.id} className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        fromAdmin
                          ? "bg-[#D90429] text-white rounded-br-md"
                          : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
                      }`}
                    >
                      {m.content ? <p className="whitespace-pre-wrap">{m.content}</p> : null}
                      {src && m.attachmentMimeType?.startsWith("video/") ? (
                        <video src={src} controls className="mt-2 max-w-full rounded-lg max-h-48" />
                      ) : null}
                      {src && m.attachmentMimeType?.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt="" className="mt-2 max-w-full rounded-lg max-h-48 object-contain" />
                      ) : null}
                      <p
                        className={`text-[10px] mt-1 ${fromAdmin ? "text-white/70" : "text-gray-400"}`}
                      >
                        {new Date(m.createdAt).toLocaleString("az-AZ", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t space-y-2">
              {pendingFile && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  {pendingFile.type.startsWith("video/") ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <ImagePlus className="w-4 h-4" />
                  )}
                  <span className="truncate flex-1">{pendingFile.name}</span>
                  <button type="button" className="text-red-600" onClick={() => setPendingFile(null)}>
                    Sil
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
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Cavab yazın..."
                  className="flex-1 px-3 py-2 border rounded-lg resize-none text-sm min-h-[44px]"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <Button
                  onClick={() => void handleSend()}
                  disabled={sending || (!text.trim() && !pendingFile)}
                  icon={sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                >
                  Göndər
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
