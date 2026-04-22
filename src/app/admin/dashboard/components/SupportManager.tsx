"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { getAdminBearerToken, getAdminDashboardApiBase } from "./admin-dashboard-api";
import type { SupportMessage, SupportTicket, SupportTicketUser } from "./support-manager/types";
import { SupportHeaderBar } from "./support-manager/SupportHeaderBar";
import { SupportStatsCards } from "./support-manager/SupportStatsCards";
import { SupportFilterBar } from "./support-manager/SupportFilterBar";
import { SupportTicketForm } from "./support-manager/SupportTicketForm";
import { SupportTicketDetailPanel } from "./support-manager/SupportTicketDetailPanel";
import { SupportTicketsTable } from "./support-manager/SupportTicketsTable";
import { SupportListFooter } from "./support-manager/SupportListFooter";
import { LiveSupportPanel } from "./support-manager/LiveSupportPanel";
import { Headphones, MessageSquare } from "lucide-react";

const API_BASE = getAdminDashboardApiBase();

export default function SupportManager() {
  const [supportMode, setSupportMode] = useState<"tickets" | "live">("tickets");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<SupportTicketUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [showForm, setShowForm] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const [formData, setFormData] = useState<Partial<SupportTicket>>({
    userId: "",
    subject: "",
    message: "",
    status: "open",
    priority: "medium",
    category: "other",
    assignedTo: "",
  });

  useEffect(() => {
    loadTickets();
    loadUsers();
  }, []);

  const getToken = () => getAdminBearerToken();

  const loadTickets = async () => {
    try {
      const stored = localStorage.getItem("decor_support_tickets");
      if (stored) {
        setTickets(JSON.parse(stored));
      }
    } catch (error) {
      console.error("[Support] Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.users || [];
        setUsers(list);
      }
    } catch (error) {
      console.error("[Support] Load users error:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      subject: "",
      message: "",
      status: "open",
      priority: "medium",
      category: "other",
      assignedTo: "",
    });
  };

  const handleNewTicket = () => {
    setSelectedTicket(null);
    resetForm();
    setShowForm(true);
    setShowReply(false);
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowForm(false);
    setShowReply(false);
  };

  const handleEditTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setFormData({
      userId: ticket.userId,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assignedTo: ticket.assignedTo,
    });
    setShowForm(true);
    setShowReply(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject?.trim() || !formData.message?.trim()) {
      alert("Mövzu və mesaj tələb olunur");
      return;
    }
    if (!formData.userId) {
      alert("İstifadəçi seçilməyib");
      return;
    }

    try {
      const token = getToken();
      const method = selectedTicket ? "PUT" : "POST";
      const url = selectedTicket ? `${API_BASE}/support/${selectedTicket.id}` : `${API_BASE}/support`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await loadTickets();
        setShowForm(false);
        setSelectedTicket(null);
        resetForm();
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      console.error("[Support] Save error:", error);

      const selectedUser = users.find((u) => u.id === formData.userId);
      const newTicket: SupportTicket = {
        id: selectedTicket?.id || Date.now(),
        userId: formData.userId!,
        userFullName: selectedUser?.fullName || "",
        userUsername: selectedUser?.username || "",
        userPhone: selectedUser?.phone,
        subject: formData.subject!,
        message: formData.message!,
        status: (formData.status as SupportTicket["status"]) || "open",
        priority: (formData.priority as SupportTicket["priority"]) || "medium",
        category: (formData.category as SupportTicket["category"]) || "other",
        assignedTo: formData.assignedTo,
        assignedToName: formData.assignedTo
          ? users.find((u) => u.id === formData.assignedTo)?.fullName
          : undefined,
        createdAt: selectedTicket?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: selectedTicket?.messages || [
          {
            id: 1,
            ticketId: selectedTicket?.id || Date.now(),
            sender: "user",
            senderName: selectedUser?.fullName || "Naməlum",
            message: formData.message!,
            createdAt: new Date().toISOString(),
          },
        ],
      };

      let updated: SupportTicket[];
      if (selectedTicket) {
        updated = tickets.map((t) => (t.id === selectedTicket.id ? newTicket : t));
      } else {
        updated = [...tickets, newTicket];
      }

      setTickets(updated);
      localStorage.setItem("decor_support_tickets", JSON.stringify(updated));

      setShowForm(false);
      setSelectedTicket(null);
      resetForm();
      alert("Yadda saxlandı");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Müraciəti silmək istədiyinizə əminsiniz?")) return;

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/support/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        await loadTickets();
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      const updated = tickets.filter((t) => t.id !== id);
      setTickets(updated);
      localStorage.setItem("decor_support_tickets", JSON.stringify(updated));
    }
  };

  const updateTicketStatus = async (ticketId: number, status: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/support/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status,
          resolvedAt: status === "resolved" ? new Date().toISOString() : undefined,
        }),
      });

      if (res.ok) {
        await loadTickets();
      } else {
        const updated = tickets.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: status as SupportTicket["status"],
                resolvedAt: status === "resolved" ? new Date().toISOString() : undefined,
                updatedAt: new Date().toISOString(),
              }
            : t
        );
        setTickets(updated);
        localStorage.setItem("decor_support_tickets", JSON.stringify(updated));
      }
    } catch (error) {
      console.error("[Support] Update error:", error);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/support/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: replyMessage.trim(),
          sender: "admin",
        }),
      });

      if (res.ok) {
        await loadTickets();
        setReplyMessage("");
        setShowReply(false);
        const updated = tickets.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      console.error("[Support] Reply error:", error);

      const newMessage: SupportMessage = {
        id: Date.now(),
        ticketId: selectedTicket.id,
        sender: "admin",
        senderName: "Admin",
        message: replyMessage.trim(),
        createdAt: new Date().toISOString(),
      };

      const updated = tickets.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, messages: [...t.messages, newMessage], updatedAt: new Date().toISOString() }
          : t
      );

      setTickets(updated);
      localStorage.setItem("decor_support_tickets", JSON.stringify(updated));

      const localUpdated = updated.find((t) => t.id === selectedTicket.id);
      if (localUpdated) setSelectedTicket(localUpdated);

      setReplyMessage("");
      setShowReply(false);
      alert("Cavab göndərildi (lokal)");
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (searchQuery) {
      const matchesSearch =
        t.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.userFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.userUsername.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    return true;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
    urgent: tickets.filter(
      (t) => t.priority === "urgent" && t.status !== "resolved" && t.status !== "closed"
    ).length,
  };

  const handleExport = () => {
    const headers = ["ID", "Mövzu", "İstifadəçi", "Kateqoriya", "Prioritet", "Status", "Tarix"];
    const rows = filteredTickets.map((t) => [
      t.id,
      t.subject,
      t.userFullName,
      t.category,
      t.priority,
      t.status,
      new Date(t.createdAt).toLocaleDateString("az-AZ"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `support_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D90429] mx-auto" />
      </Card>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setSupportMode("tickets")}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
              supportMode === "tickets"
                ? "bg-[#D90429] text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Tiketlər
          </button>
          <button
            type="button"
            onClick={() => setSupportMode("live")}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
              supportMode === "live"
                ? "bg-[#D90429] text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Headphones className="w-4 h-4" />
            Canlı dəstək
          </button>
        </div>
      </div>

      {supportMode === "live" ? (
        <LiveSupportPanel />
      ) : (
        <>
      <SupportHeaderBar onExport={handleExport} onNewTicket={handleNewTicket} />
      <SupportStatsCards stats={stats} />
      <SupportFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />

      {showForm && (
        <SupportTicketForm
          users={users}
          selectedTicket={selectedTicket}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setSelectedTicket(null);
            resetForm();
          }}
        />
      )}

      {selectedTicket && !showForm && (
        <SupportTicketDetailPanel
          ticket={selectedTicket}
          showReply={showReply}
          replyMessage={replyMessage}
          onReplyChange={setReplyMessage}
          onToggleReply={setShowReply}
          onSendReply={handleSendReply}
          onEdit={handleEditTicket}
          onDelete={handleDelete}
          onClose={() => {
            setSelectedTicket(null);
            setShowReply(false);
          }}
          onCancelReply={() => {
            setShowReply(false);
            setReplyMessage("");
          }}
        />
      )}

      {!selectedTicket && !showForm && (
        <SupportTicketsTable
          tickets={filteredTickets}
          onView={handleViewTicket}
          onEdit={handleEditTicket}
          onDelete={handleDelete}
          onStatusChange={updateTicketStatus}
        />
      )}

      {filteredTickets.length > 0 && !selectedTicket && !showForm && (
        <SupportListFooter
          filteredCount={filteredTickets.length}
          stats={{ open: stats.open, resolved: stats.resolved, urgent: stats.urgent }}
        />
      )}
        </>
      )}
    </div>
  );
}
