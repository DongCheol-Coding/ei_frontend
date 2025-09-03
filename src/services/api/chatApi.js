// src/services/api/chatApi.js

import { api } from "./basicApi";

/* [추가됨] 채팅방 개설: supportEmail로 1:1 방 열고 roomId(Long) 반환 */
export async function openRoom(supportEmail, opts = {}) {
  if (typeof supportEmail !== "string" || !supportEmail.trim()) {
    throw new Error("supportEmail is required");
  }
  const res = await api.post("/api/chat/rooms/open", null, {
    params: { supportEmail: supportEmail.trim() },
    signal: opts.signal, // AbortController 신호(선택)
  });
  // 백엔드가 Long을 그대로 반환하므로 number로 보정
  return Number(res?.data);
}

/* [추가됨] 메시지 조회(오래된 순): 특정 roomId의 히스토리 배열 반환 */
export async function getMessages(roomId, opts = {}) {
  const id = Number(roomId);
  if (!Number.isFinite(id)) throw new Error("Invalid roomId");

  const res = await api.get(`/api/chat/rooms/${id}/message`, {
    signal: opts.signal, // AbortController 신호(선택)
  });

  const raw = Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];
  // 프런트에서 사용하기 쉽게 필드 정규화
  return raw.map((m) => ({
    id: m?.id ?? null,
    chatRoomId: m?.chatRoomId ?? id,
    senderEmail: m?.senderEmail ?? "",
    message: m?.message ?? "",
    sentAt: m?.sentAt ?? null,
  }));
}
