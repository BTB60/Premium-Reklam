"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { 
  Search, Download, Plus, Edit, Trash2, Send, Reply, 
  AlertCircle, CheckCircle, Clock, Filter, MessageSquare,
  User, Calendar, Tag, X
} from "lucide-react";

interface SupportTicket {
  id: number;
  userId: string;
  userFullName: string;
  userUsername: string;
  userPhone?: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: "technical" | "billing" | "order" | "account" | "other";
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  assignedTo?: string;
  assignedToName?: string;
  messages: SupportMessage[];
}

interface SupportMessage {
  id: number;
  ticketId: number;
  sender: "user" | "admin";
  senderName: string;
  message: string;
  createdAt: string;
  attachments?: string[];
}

interface User {
  id: string;
  fullName: string;
  username: string;
  phone?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "https://premium-reklam-backend.onrender.com/api";

export default function SupportManager() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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

  const getToken = () => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("decor_current_user");
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return parsed?.token || null;
    } catch {
      return null;
    }
  };

  const loadTickets = async () => {
    try {
      const token = getToken();
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
      const res = await fetch(`${API_BASE}/users`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
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
      const url = selectedTicket 
        ? `${API_BASE}/support/${selectedTicket.id}` 
        : `${API_BASE}/support`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
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
      
      const selectedUser = users.find(u => u.id === formData.userId);
      const newTicket: SupportTicket = {
        id: selectedTicket?.id || Date.now(),
        userId: formData.userId!,
        userFullName: selectedUser?.fullName || "",
        userUsername: selectedUser?.username || "",
        userPhone: selectedUser?.phone,
        subject: formData.subject!,
        message: formData.message!,
        status: formData.status as any || "open",
        priority: formData.priority as any || "medium",
        category: formData.category as any || "other",
        assignedTo: formData.assignedTo,
        assignedToName: formData.assignedTo ? users.find(u => u.id === formData.assignedTo)?.fullName : undefined,
        createdAt: selectedTicket?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: selectedTicket?.messages || [{
          id: 1,
          ticketId: selectedTicket?.id || Date.now(),
          sender: "user",
          senderName: selectedUser?.fullName || "Naməlum",
          message: formData.message!,
          createdAt: new Date().toISOString(),
        }],
      };

      let updated: SupportTicket[];
      if (selectedTicket) {
        updated = tickets.map(t => t.id === selectedTicket.id ? newTicket : t);
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
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        await loadTickets();
      } else {
        throw new Error("API error");
      }
    } catch (error) {
      const updated = tickets.filter(t => t.id !== id);
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
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          status,
          resolvedAt: status === "resolved" ? new Date().toISOString() : undefined
        })
      });
      
      if (res.ok) {
        await loadTickets();
      } else {
        const updated = tickets.map(t => 
          t.id === ticketId 
            ? { 
                ...t, 
                status: status as any,
                resolvedAt: status === "resolved" ? new Date().toISOString() : undefined,
                updatedAt: new Date().toISOString()
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
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: replyMessage.trim(),
          sender: "admin"
        })
      });
      
      if (res.ok) {
        await loadTickets();
        setReplyMessage("");
        setShowReply(false);
        const updated = tickets.find(t => t.id === selectedTicket.id);
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
      
      const updated = tickets.map(t => 
        t.id === selectedTicket.id 
          ? { ...t, messages: [...t.messages, newMessage], updatedAt: new Date().toISOString() } 
          : t
      );
      
      setTickets(updated);
      localStorage.setItem("decor_support_tickets", JSON.stringify(updated));
      
      const localUpdated = updated.find(t => t.id === selectedTicket.id);
      if (localUpdated) setSelectedTicket(localUpdated);
      
      setReplyMessage("");
      setShowReply(false);
      alert("Cavab göndərildi (lokal)");
    }
  };

  const filteredTickets = tickets.filter(t => {
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
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    closed: tickets.filter(t => t.status === "closed").length,
    urgent: tickets.filter(t => t.priority === "urgent" && t.status !== "resolved" && t.status !== "closed").length,
  };

  const handleExport = () => {
    const headers = ["ID", "Mövzu", "İstifadəçi", "Kateqoriya", "Prioritet", "Status", "Tarix"];
    const rows = filteredTickets.map(t => [
      t.id,
      t.subject,
      t.userFullName,
      t.category,
      t.priority,
      t.status,
      new Date(t.createdAt).toLocaleDateString("az-AZ")
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `support_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: "Açıq",
      in_progress: "İcra olunur",
      resolved: "Həll olunub",
      closed: "Bağlandı"
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Aşağı",
      medium: "Orta",
      high: "Yüksək",
      urgent: "Təcili"
    };
    return labels[priority] || priority;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      technical: "Texniki",
      billing: "Ödəniş",
      order: "Sifariş",
      account: "Hesab",
      other: "Digər"
    };
    return labels[category] || category;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-100 text-blue-700",
      in_progress: "bg-amber-100 text-amber-700",
      resolved: "bg-green-100 text-green-700",
      closed: "bg-gray-100 text-gray-700"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-100 text-gray-700",
      medium: "bg-blue-100 text-blue-700",
      high: "bg-orange-100 text-orange-700",
      urgent: "bg-red-100 text-red-700"
    };
    return colors[priority] || "bg-gray-100 text-gray-700";
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-[#D90429]" />
          <h1 className="text-2xl font-bold text-[#1F2937]">Dəstək</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Button onClick={handleNewTicket} icon={<Plus className="w-4 h-4" />}>
            Yeni müraciət
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-[#6B7280] text-sm">Ümumi</p>
          <p className="text-2xl font-bold text-[#1F2937]">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-blue-50">
          <p className="text-blue-600 text-sm flex items-center gap-1">
            <Clock className="w-4 h-4" /> Açıq
          </p>
          <p className="text-2xl font-bold text-blue-700">{stats.open}</p>
        </Card>
        <Card className="p-4 bg-amber-50">
          <p className="text-amber-600 text-sm">İcra olunur</p>
          <p className="text-2xl font-bold text-amber-700">{stats.inProgress}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-green-600 text-sm flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Həll olunub
          </p>
          <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
        </Card>
        <Card className="p-4 bg-red-50">
          <p className="text-red-600 text-sm flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> Təcili
          </p>
          <p className="text-2xl font-bold text-red-700">{stats.urgent}</p>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Axtar: mövzu, istifadəçi, mesaj..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün statuslar</option>
            <option value="open">Açıq</option>
            <option value="in_progress">İcra olunur</option>
            <option value="resolved">Həll olunub</option>
            <option value="closed">Bağlandı</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün prioritetlər</option>
            <option value="low">Aşağı</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksək</option>
            <option value="urgent">Təcili</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D90429]"
          >
            <option value="all">Bütün kateqoriyalar</option>
            <option value="technical">Texniki</option>
            <option value="billing">Ödəniş</option>
            <option value="order">Sifariş</option>
            <option value="account">Hesab</option>
            <option value="other">Digər</option>
          </select>
        </div>
      </Card>

      {showForm && (
        <Card className="p-6 mb-6 border-2 border-[#D90429]">
          <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            {selectedTicket ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {selectedTicket ? "Müraciəti redaktə et" : "Yeni müraciət əlavə et"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">İstifadəçi *</label>
                <select
                  value={formData.userId || ""}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                  required
                  disabled={!!selectedTicket}
                >
                  <option value="">Seçin</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} (@{u.username})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Mövzu *</label>
                <input
                  type="text"
                  value={formData.subject || ""}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Kateqoriya</label>
                <select
                  value={formData.category || "other"}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                >
                  <option value="technical">Texniki</option>
                  <option value="billing">Ödəniş</option>
                  <option value="order">Sifariş</option>
                  <option value="account">Hesab</option>
                  <option value="other">Digər</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Prioritet</label>
                <select
                  value={formData.priority || "medium"}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                >
                  <option value="low">Aşağı</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksək</option>
                  <option value="urgent">Təcili</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Status</label>
                <select
                  value={formData.status || "open"}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                >
                  <option value="open">Açıq</option>
                  <option value="in_progress">İcra olunur</option>
                  <option value="resolved">Həll olunub</option>
                  <option value="closed">Bağlandı</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-1">Təyin et</label>
                <select
                  value={formData.assignedTo || ""}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                >
                  <option value="">Seçilməyib</option>
                  {users.filter(u => u.username !== "admin").map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Mesaj *</label>
              <textarea
                value={formData.message || ""}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429]"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" icon={<Send className="w-4 h-4" />}>Yadda saxla</Button>
              <Button
                variant="ghost"
                onClick={() => { setShowForm(false); setSelectedTicket(null); resetForm(); }}
                icon={<X className="w-4 h-4" />}
              >
                Ləğv et
              </Button>
            </div>
          </form>
        </Card>
      )}

      {selectedTicket && !showForm && (
        <Card className="p-6 mb-6 border-2 border-[#D90429]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#1F2937] text-lg">{selectedTicket.subject}</h3>
              <p className="text-sm text-[#6B7280] mt-1">
                #{selectedTicket.id} • {selectedTicket.userFullName} (@{selectedTicket.userUsername})
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditTicket(selectedTicket)}
                icon={<Edit className="w-4 h-4" />}
              >
                Redaktə
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(selectedTicket.id)}
                icon={<Trash2 className="w-4 h-4" />}
                className="text-red-500"
              >
                Sil
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedTicket(null); setShowReply(false); }}
                icon={<X className="w-4 h-4" />}
              >
                Bağla
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
              {getStatusLabel(selectedTicket.status)}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
              {getPriorityLabel(selectedTicket.priority)}
            </span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
              {getCategoryLabel(selectedTicket.category)}
            </span>
            {selectedTicket.assignedToName && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 flex items-center gap-1">
                <User className="w-3 h-3" /> {selectedTicket.assignedToName}
              </span>
            )}
          </div>

          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {selectedTicket.messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg ${
                  msg.sender === "admin" 
                    ? "bg-[#D90429]/10 border border-[#D90429]/20 ml-8" 
                    : "bg-gray-50 border border-gray-200 mr-8"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    msg.sender === "admin" ? "text-[#D90429]" : "text-[#1F2937]"
                  }`}>
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
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Cavabınızı yazın..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D90429] mb-2"
              />
              <div className="flex gap-2">
                <Button onClick={handleSendReply} icon={<Send className="w-4 h-4" />}>
                  Göndər
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setShowReply(false); setReplyMessage(""); }}
                  icon={<X className="w-4 h-4" />}
                >
                  Ləğv et
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowReply(true)}
              variant="secondary"
              icon={<Reply className="w-4 h-4" />}
            >
              Cavab ver
            </Button>
          )}
        </Card>
      )}

      {!selectedTicket && !showForm && (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Mövzu</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">İstifadəçi</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Kateqoriya</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Prioritet</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Tarix</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B7280]">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6B7280]">
                    Müraciət tapılmadı
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewTicket(ticket)}
                  >
                    <td className="py-3 px-4 font-medium">#{ticket.id}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#1F2937]">{ticket.subject}</p>
                      <p className="text-xs text-[#6B7280] line-clamp-1">{ticket.message}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium">{ticket.userFullName}</p>
                        <p className="text-xs text-[#6B7280]">@{ticket.userUsername}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        {getCategoryLabel(ticket.category)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={ticket.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateTicketStatus(ticket.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs px-2 py-1 rounded border ${getStatusColor(ticket.status)}`}
                      >
                        <option value="open">Açıq</option>
                        <option value="in_progress">İcra olunur</option>
                        <option value="resolved">Həll olunub</option>
                        <option value="closed">Bağlandı</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-[#6B7280]">
                        {new Date(ticket.createdAt).toLocaleDateString("az-AZ")}
                      </span>
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleViewTicket(ticket)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                          title="Bax"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTicket(ticket)}
                          className="p-2 text-amber-500 hover:bg-amber-50 rounded"
                          title="Redaktə"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ticket.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {filteredTickets.length > 0 && !selectedTicket && !showForm && (
        <Card className="mt-4 p-4 bg-[#1F2937] text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-white/60 text-xs">Göstərilən</p>
                <p className="font-bold">{filteredTickets.length} ədəd</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Açıq</p>
                <p className="font-bold text-blue-400">{stats.open} ədəd</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Həll olunub</p>
                <p className="font-bold text-green-400">{stats.resolved} ədəd</p>
              </div>
              {stats.urgent > 0 && (
                <div>
                  <p className="text-white/60 text-xs">Təcili</p>
                  <p className="font-bold text-red-400">{stats.urgent} ədəd</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}