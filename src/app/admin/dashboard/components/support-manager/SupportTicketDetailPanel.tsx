"use client";

import { Edit, Trash2, X, User, Calendar, Send, Reply } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { SupportTicket } from "./types";
import {
  getCategoryLabel,
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
} from "./labels";

export function SupportTicketDetailPanel({
  ticket,
  showReply,
  replyMessage,
  onReplyChange,
  onToggleReply,
  onSendReply,
  onEdit,
  onDelete,
  onClose,
  onCancelReply,
}: {
  ticket: SupportTicket;
  showReply: boolean;
  replyMessage: string;
  onReplyChange: (v: string) => void;
  onToggleReply: (show: boolean) => void;
  onSendReply: () => void;
  onEdit: (t: SupportTicket) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
  onCancelReply: () => void;
}) {
  return (
    <Card className="p-6 mb-6 border-2 border-[#D90429]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#1F2937] text-lg">{ticket.subject}</h3>
          <p className="text-sm text-[#6B7280] mt-1">
            #{ticket.id} • {ticket.userFullName} (@{ticket.userUsername})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(ticket)} icon={<Edit className="w-4 h-4" />}>
            Redaktə
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(ticket.id)}
            icon={<Trash2 className="w-4 h-4" />}
            className="text-red-500"
          >
            Sil
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} icon={<X className="w-4 h-4" />}>
            Bağla
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
          {getStatusLabel(ticket.status)}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
          {getPriorityLabel(ticket.priority)}
        </span>
        <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
          {getCategoryLabel(ticket.category)}
        </span>
        {ticket.assignedToName && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 flex items-center gap-1">
            <User className="w-3 h-3" /> {ticket.assignedToName}
          </span>
        )}
      </div>

      <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 rounded-lg ${
              msg.sender === "admin"
                ? "bg-[#D90429]/10 border border-[#D90429]/20 ml-8"
                : "bg-gray-50 border border-gray-200 mr-8"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-sm font-medium ${
                  msg.sender === "admin" ? "text-[#D90429]" : "text-[#1F2937]"
                }`}
              >
                {msg.senderName}
              </span>
              <span className="text-xs text-[#6B7280] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(msg.createdAt).toLocaleString("az-AZ")}
              </span>
            </div>
            <p className="text-sm text-[#6B7280] whitespace-pre-wrap">{msg.message}</p>
          </div>
        ))}
      </div>

      {showReply ? (
        <div className="border-t pt-4">
          <textarea
            value={replyMessage}
            onChange={(e) => onReplyChange(e.target.value)}
            placeholder="Cavabınızı yazın..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429] mb-2"
          />
          <div className="flex gap-2">
            <Button onClick={onSendReply} icon={<Send className="w-4 h-4" />}>
              Göndər
            </Button>
            <Button variant="ghost" onClick={onCancelReply} icon={<X className="w-4 h-4" />}>
              Ləğv et
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => onToggleReply(true)} variant="secondary" icon={<Reply className="w-4 h-4" />}>
          Cavab ver
        </Button>
      )}
    </Card>
  );
}
