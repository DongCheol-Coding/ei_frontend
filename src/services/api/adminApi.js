import { api } from "./basicApi";

export async function searchUsers(query = {}, opts = {}) {
  const { name, phoneSuffix, role } = query;
  const params = {};

  if (typeof name === "string" && name.trim()) params.name = name.trim();
  if (typeof phoneSuffix === "string" && phoneSuffix.trim())
    params.phoneSuffix = phoneSuffix.trim();
  if (typeof role === "string" && role.trim()) params.role = role.trim();

  const headers = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  try {
    const res = await api.get("/search", {
      params,
      headers,
      signal: opts.signal,
    });

    const body = res?.data;
    const list = Array.isArray(body?.data) ? body.data : [];

    return list.map((u) => ({
      id: u?.id,
      email: u?.email ?? "",
      name: u?.name ?? "",
      phone: u?.phone ?? "",
      roles: Array.isArray(u?.roles) ? u.roles : [],
       social: Boolean(u?.isSocial ?? u?.social),
  isDeleted: Boolean(u?.isDeleted),   
      imageUrl: u?.imageUrl ?? null,
    }));
  } catch (err) {
    // 취소된 요청이면 그대로 throw 해도 되고, 메시지 가다듬어서 던져도 됩니다.
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "사용자 검색 요청에 실패했습니다.";
    // 필요 시 로깅
    // console.error("[searchUsers] failed:", err);
    throw new Error(msg);
  }
}

export async function adminDeleteUser(userId, opts = {}) {
  if (userId === null || userId === undefined) {
    throw new Error("userId는 필수입니다.");
  }

  const headers = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  try {
    // adminApi.js가 /admin/users를 base로 쓰는 전제(검색이 "/search"였던 것과 동일 패턴)
    const res = await api.delete(`api/auth/admin/users/${userId}`, {
      headers,
      signal: opts.signal,
    });

    const body = res?.data ?? null;
    const success = body?.success ?? true;
    const message =
      body?.data || body?.message || "해당 계정이 삭제(탈퇴) 처리되었습니다.";

    return { success, message };
  } catch (err) {
    const status = err?.response?.status;
    const msg =
      err?.response?.data?.message ||
      (status === 401
        ? "인증이 필요합니다."
        : status === 403
        ? "권한이 없습니다."
        : "강제 탈퇴 요청에 실패했습니다.");
    throw new Error(msg);
  }
}
