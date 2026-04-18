"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { auth, messages, type User, type Message } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Send, User as UserIcon, Headphones } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Admin ID (in real app, this would come from settings)
  const ADMIN_ID = "admin-1";

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    loadMessages(currentUser.id);
    setLoading(false);

    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      loadMessages(currentUser.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const loadMessages = (userId: string) => {
    const conversation = messages.getConversation(userId, ADMIN_ID);
    setChatMessages(conversation);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!user || !newMessage.trim()) return;

    messages.send(user.id, ADMIN_ID, newMessage.trim());
    setNewMessage("");
    loadMessages(user.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
            <h1 className="text-2xl font-bold text-[#1F2937]">Dəstək Mərkəzi</h1>
          </motion.div>

          <Card className="h-[calc(100vh-200px)] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D90429] rounded-full flex items-center justify-center">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold">Admin Dəstək</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Onlayn
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Headphones className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Dəstək ilə əlaqə saxlayın</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Sualınız və ya probleminiz var? Bizə yazın!
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isOwn = msg.senderId === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl ${
                          isOwn
                            ? "bg-[#D90429] text-white rounded-br-none"
                            : "bg-gray-100 text-gray-800 rounded-bl-none"
                        }`}
                      >
                        <p>{msg.content}</p>
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

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 px-4 py-2 border rounded-lg resize-none"
                  rows={2}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  icon={<Send className="w-4 h-4" />}
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
