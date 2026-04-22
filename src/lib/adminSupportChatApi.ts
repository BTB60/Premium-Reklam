import { getAdminBearerToken } from "@/app/admin/dashboard/components/admin-dashboard-api";
import { getRestApiBase } from "./restApiBase";
import type { SupportChatMessageDto } from "./supportChatApi";

export interface SupportThreadSummaryDto {
  userId: number;
  username: string;
  fullName: string;
  lastPreview: string;
  lastMessageAt: string;
  unreadForAdmin: number;
}

function adminToken(): string | null {
  if (typeof window === "undefined") return null;
  return getAdminBearerToken();
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { message?: string };
    if (j?.message) return j.message;
  } catch {
    /* ignore */
  }
  return text || `HTTP ${res.status}`;
}

export async function adminSupportChatFetchThreads(): Promise<SupportThreadSummaryDto[]> {
  const token = adminToken();
  if (!token) throw new Error("Admin girişi tələb olunur");
  const res = await fetch(`${getRestApiBase()}/admin/support-chat/threads`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as SupportThreadSummaryDto[];
}

export async function adminSupportChatFetchMessages(userId: number): Promise<SupportChatMessageDto[]> {
  const token = adminToken();
  if (!token) throw new Error("Admin girişi tələb olunur");
  const res = await fetch(`${getRestApiBase()}/admin/support-chat/users/${userId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as SupportChatMessageDto[];
}

export async function adminSupportChatSendMessage(
  userId: number,
  body: {
    content: string;
    attachmentBase64?: string;
    attachmentMimeType?: string;
    attachmentFileName?: string;
  }
): Promise<SupportChatMessageDto> {
  const token = adminToken();
  if (!token) throw new Error("Admin girişi tələb olunur");
  const res = await fetch(`${getRestApiBase()}/admin/support-chat/users/${userId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as SupportChatMessageDto;
}
