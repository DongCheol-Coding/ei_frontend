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
      social: Boolean(u?.social),
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

export async function getCourses(opts = {}) {
  const headers = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  try {
    const res = await api.get("/api/course", {
      headers,
      signal: opts.signal,
    });

    const body = res?.data;
    const list = Array.isArray(body?.data) ? body.data : [];

    return list.map((c) => ({
      id: Number(c?.id),
      title: c?.title ?? "",
      imageUrl: c?.imageUrl ?? null,
      // 서버가 문자열로 줄 수도 있으니 안전 변환
      price: typeof c?.price === "number" ? c.price : Number(c?.price ?? 0),
      published: Boolean(c?.published),
    }));
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "강의 목록 조회에 실패했습니다.";
    throw new Error(msg);
  }
}

export async function createCourse(payload, opts = {}) {
  const { title, description, price, image } = payload ?? {};

  const fd = new FormData();
  if (typeof title === "string") fd.append("title", title);
  if (typeof description === "string") fd.append("description", description);

  // price는 multipart에서도 문자열로 전달되는 경우가 많아 안전하게 문자열로 전송
  if (price !== undefined && price !== null) {
    const n =
      typeof price === "number"
        ? price
        : Number(String(price).replace(/\D/g, "")) || 0;
    fd.append("price", String(n));
  }

  if (image instanceof File || image instanceof Blob) {
    // 서버에서 기대하는 필드명이 'image'라고 하셨으므로 그대로 사용
    fd.append("image", image);
  }

  const headers = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  // Content-Type은 지정하지 않으면 브라우저가 boundary 포함해 자동 설정합니다.

  try {
    const res = await api.post("/api/course", fd, {
      headers,
      signal: opts.signal,
      onUploadProgress: (evt) => {
        if (typeof opts.onProgress === "function" && evt.total) {
          const percent = Math.round((evt.loaded * 100) / evt.total);
          opts.onProgress(percent);
        }
      },
    });

    const body = res?.data;
    const c = body?.data ?? {};

    return {
      id: Number(c?.id ?? 0),
      title: c?.title ?? title ?? "",
      description: c?.description ?? description ?? "",
      imageUrl: c?.imageUrl ?? null,
      price:
        typeof c?.price === "number" ? c.price : Number(c?.price ?? 0) || 0,
      published: Boolean(c?.published),
    };
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "코스 생성에 실패했습니다.";
    throw new Error(msg);
  }
}
