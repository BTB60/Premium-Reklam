export interface SupportMessage {
  id: number;
  ticketId: number;
  sender: "user" | "admin";
  senderName: string;
  message: string;
  createdAt: string;
  attachments?: string[];
}

export interface SupportTicket {
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

export interface SupportTicketUser {
  id: string;
  fullName: string;
  username: string;
  phone?: string;
}
