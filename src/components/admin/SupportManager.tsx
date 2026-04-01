"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { messages, type Message, type User } from "@/lib/db";
import { Send, User as UserIcon, Circle } from "lucide-react";

interface SupportManagerProps {
  users: User[];
}

export function SupportManager({ users }: SupportManagerProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ADMIN_ID = "admin-1";

  // Get users who have sent messages
  const activeUsers = users.filter((u) => {
    const userMessages = messages.getConversation(u.id, ADMIN_ID);
    return userMessages.length > 0;
  });

  useEffect(() => {
    if (selectedUser) {
      const interval = setInterval(() => {
        loadMessages(selectedUser.id);
      }, 3000);
      loadMessages(selectedUser.id);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const loadMessages = (userId: string) => {
    const conversation = messages.getConversation(userId, ADMIN_ID);
    setChatMessages(conversation);
    // Mark messages as read
    conversation.forEach((m) => {
      if (m.receiverId === ADMIN_ID && !m.isRead) {
        messages.markAsRead(m.id);
      }
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!selectedUser || !newMessage.trim()) return;
    messages.send(ADMIN_ID, selectedUser.id, newMessage.trim());
    setNewMessage("");
    loadMessages(selectedUser.id);
  };

  const getUnreadCount = (userId: string) => {
    return messages
      .getConversation(userId, ADMIN_ID)
      .filter((m) => m.receiverId === ADMIN_ID && !m.isRead).length;
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
      {/* Users List */}
      <Card className="p-4 overflow-y-auto">
        <h3 className="font-bold mb-4">Müştəri Mesajları</h3>
        <div className="space-y-2">
          {activeUsers.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Mesaj yoxdur</p>
          ) : (
            activeUsers.map((user) => {
              const unread = getUnreadCount(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-3 rounded-lg text-left flex items-center gap-3 ${
                    selectedUser?.id === user.id
                      ? "bg-[#D90429] text-white"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-xs opacity-70">{user.phone}</p>
                  </div>
                  {unread > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </Card>

      {/* Chat */}
      <Card className="md:col-span-2 p-4 flex flex-col">
        {selectedUser ? (
          <>
            <div className="border-b pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-bold">{selectedUser.fullName}</p>
                  <p className="text-xs text-gray-500">{selectedUser.phone}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-3">
              {chatMessages.map((msg) => {
                const isAdmin = msg.senderId === ADMIN_ID;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl ${
                        isAdmin
                          ? "bg-[#D90429] text-white rounded-br-none"
                          : "bg-gray-100 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isAdmin ? "text-white/70" : "text-gray-500"
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
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Mesaj yazın..."
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Müştəri seçin</p>
          </div>
        )}
      </Card>
    </div>
  );
}
