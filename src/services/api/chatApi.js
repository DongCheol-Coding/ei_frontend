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

/** 상담자 본인 프로필 조회(선택) */
export async function getMySupportInfo(opts = {}) {
  const tryGet = async (path) => {
    try {
      const r = await api.get(path, { signal: opts.signal });
      return r?.data ?? null;
    } catch {
      return null;
    }
  };

  const data =
    (await tryGet("/api/support/me")) || (await tryGet("/api/users/me"));

  if (!data)
    throw new Error("지원되는 프로필 API가 없습니다. (/api/support/me 권장)");

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

/** 상담자 본인 채팅방 목록(ROLE_SUPPORT) - 백엔드: GET /api/chat/rooms/mine */
export async function getSupportRooms(params = {}) {
  const {
    status = "open", // open | closed | all
    page = 0,
    size = 50,
    sort = "createdAt,desc",
    signal,
  } = params;

  const res = await api.get("/api/chat/rooms/mine", {
    params: { status, page, size, sort },
    signal,
  });

  const body = res?.data ?? {};
  const content = Array.isArray(body?.content)
    ? body.content
    : Array.isArray(body)
    ? body
    : [];

  const items = content.map((r) => ({
    id: Number(r?.roomId ?? r?.id ?? 0),
    memberName: r?.memberName ?? r?.member?.name ?? "",
    memberEmail: r?.memberEmail ?? r?.member?.email ?? "",
    createdAt: r?.createdAt ?? null,
    closedAt: r?.closedAt ?? null,
    lastMessage: r?.lastMessage ?? null,
  }));

  return {
    items,
    page: body?.pageable?.pageNumber ?? page,
    size: body?.pageable?.pageSize ?? size,
    totalPages: body?.totalPages ?? 1,
    totalElements: body?.totalElements ?? items.length,
  };
}
