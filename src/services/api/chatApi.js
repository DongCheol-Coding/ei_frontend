// src/services/api/chatApi.js
// [추가됨] 채팅/상담 관련 REST API 유틸
import { api } from "./basicApi";

/** 채팅방 개설: supportEmail로 1:1 방 열고 roomId(Long) 반환 */
export async function openRoom(supportEmail, opts = {}) {
  if (typeof supportEmail !== "string" || !supportEmail.trim()) {
    throw new Error("supportEmail is required");
  }
  const res = await api.post("/api/chat/rooms/open", null, {
    params: { supportEmail: supportEmail.trim() },
    signal: opts.signal,
  });
  return Number(res?.data);
}

/** 메시지 조회(오래된 순): 특정 roomId의 히스토리 배열 반환 */
export async function getMessages(roomId, opts = {}) {
  const id = Number(roomId);
  if (!Number.isFinite(id)) throw new Error("Invalid roomId");

  const res = await api.get(`/api/chat/rooms/${id}/message`, {
    signal: opts.signal,
  });

  const raw = Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];
  return raw.map((m) => ({
    id: m?.id ?? null,
    chatRoomId: m?.chatRoomId ?? id,
    senderEmail: m?.senderEmail ?? "",
    message: m?.message ?? "",
    sentAt: m?.sentAt ?? null,
  }));
}

/** 상담자 본인 프로필 조회
 * 기대 엔드포인트: GET /api/support/me  (없다면 /api/users/me 로 대체 가능)
 */
export async function getMySupportInfo(opts = {}) {
  // 우선순위: /api/support/me → (404/501 등 실패 시) /api/users/me 폴백
  const tryGet = async (path) => {
    try {
      const r = await api.get(path, { signal: opts.signal });
      return r?.data ?? null;
    } catch {
      return null;
    }
  };

  const data =
    (await tryGet("/api/support/me")) || (await tryGet("/api/users/me")); // 프로젝트에 따라 이 경로가 이미 있을 수 있음

  if (!data)
    throw new Error("지원되는 프로필 API가 없습니다. (/api/support/me 권장)");

  // 정규화해서 반환(키 이름이 달라도 안전하게 매핑)
  return {
    id: data.id ?? data.userId ?? null,
    email: data.email ?? data.username ?? "",
    name: data.name ?? data.nickname ?? data.fullName ?? "",
    avatarUrl: data.avatarUrl ?? data.profileImageUrl ?? data.imageUrl ?? null,
    roles: Array.isArray(data.roles) ? data.roles : [],
    workingHours: data.workingHours ?? null,
    phone: data.phone ?? data.tel ?? null,
  };
}

/** 상담자 본인 채팅방 목록(선택)
 * 기대 엔드포인트: GET /api/chat/rooms/support  → ChatService.getRoomsForSupport() 매핑
 * 반환 예시(간단화): [{ id, member: { id,email,name,avatarUrl }, support: { id,email,name } }]
 */
export async function getSupportRooms(opts = {}) {
  const res = await api.get("/api/chat/rooms/support/open", {
    signal: opts.signal,
  });
  const raw = Array.isArray(res?.data) ? res.data : [];
  return raw.map((r) => ({
    id: r?.id ?? null,
    member: {
      id: r?.member?.id ?? null,
      email: r?.member?.email ?? "",
      name: r?.member?.name ?? r?.member?.nickname ?? "",
      avatarUrl: r?.member?.avatarUrl ?? r?.member?.profileImageUrl ?? null,
    },
    support: {
      id: r?.support?.id ?? null,
      email: r?.support?.email ?? "",
      name: r?.support?.name ?? r?.support?.nickname ?? "",
    },
    // 필요 시 백엔드에서 lastMessage/updatedAt 등을 포함해주면 그대로 노출 가능
    lastMessage: r?.lastMessage ?? null,
    updatedAt: r?.updatedAt ?? null,
  }));
}
