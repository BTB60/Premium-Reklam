import { getRestApiBase } from "./restApiBase";

/** Server ilə eyni limit */
export const SUPPORT_MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

export type SupportSenderRole = "USER" | "ADMIN";

export interface SupportChatMessageDto {
  id: number;
  userId: number;
  senderRole: SupportSenderRole;
  content: string;
  attachmentMimeType: string | null;
  attachmentFileName: string | null;
  attachmentSizeBytes: number | null;
  hasAttachment: boolean;
  attachmentBase64: string | null;
  createdAt: string;
  readByUser: boolean;
  readByAdmin: boolean;
}

function customerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("decor_current_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return typeof parsed?.token === "string" ? parsed.token : null;
  } catch {
    return null;
  }
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

export function fileToBase64NoPrefix(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = () => reject(new Error("Fayl oxunmadı"));
    r.readAsDataURL(file);
  });
}

export async function supportChatFetchMessages(): Promise<SupportChatMessageDto[]> {
  const token = customerToken();
  if (!token) throw new Error("Giriş tələb olunur");
  const res = await fetch(`${getRestApiBase()}/support/chat/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as SupportChatMessageDto[];
}

export async function supportChatSendMessage(body: {
  content: string;
  attachmentBase64?: string;
  attachmentMimeType?: string;
  attachmentFileName?: string;
}): Promise<SupportChatMessageDto> {
  const token = customerToken();
  if (!token) throw new Error("Giriş tələb olunur");
  const res = await fetch(`${getRestApiBase()}/support/chat/messages`, {
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
