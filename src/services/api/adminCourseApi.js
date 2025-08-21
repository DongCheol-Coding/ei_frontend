import { api } from "./basicApi";

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

export async function getCourseLectures(courseId, opts = {}) {
  if (
    courseId === undefined ||
    courseId === null ||
    String(courseId).trim() === ""
  ) {
    throw new Error("유효한 courseId가 필요합니다.");
  }

  const headers = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const cid = encodeURIComponent(String(courseId).trim());
  const url = `/api/courses/${cid}/lectures`;

  try {
    const res = await api.get(url, { headers, signal: opts.signal });

    // 서버 응답: { status, success, message, data: [...] }
    const body = res?.data;
    const list = Array.isArray(body?.data) ? body.data : [];

    const toNum = (v, d = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : d;
    };
    const clamp01 = (n) => {
      const x = Number(n);
      if (!Number.isFinite(x)) return 0;
      if (x < 0) return 0;
      if (x > 1) return 1;
      return x;
    };

    // 필요한 필드만 프런트에서 사용하기 좋게 정규화
    return (
      list
        .map((l) => ({
          id: toNum(l?.id, 0),
          title: l?.title ?? "",
          orderIndex: toNum(l?.orderIndex, 0),
          durationSec: toNum(l?.durationSec, 0),
          progress: clamp01(l?.progress ?? 0),
        }))
        // 혹시 서버가 정렬을 보장하지 않는 경우 대비
        .sort((a, b) => a.orderIndex - b.orderIndex || a.id - b.id)
    );
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "강의 목록 조회에 실패했습니다.";
    throw new Error(msg);
  }
}

export async function createLectureWithVideo(courseId, fields = {}, opts = {}) {
  if (
    courseId === undefined ||
    courseId === null ||
    String(courseId).trim() === ""
  ) {
    throw new Error("유효한 courseId가 필요합니다.");
  }
  if (typeof fields.title !== "string" || !fields.title.trim()) {
    throw new Error("강의 제목(title)은 필수입니다.");
  }

  // ---- 정규화 helpers
  const toNum = (v, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  const toBool = (v) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      return s === "true" || s === "1" || s === "yes" || s === "y";
    }
    return false;
  };
  const clamp01 = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
  };

  // ---- payload(JSON) 구성 → fd.append("data", JSON.stringify(...))
  const payload = {
    title: fields.title.trim(),
    description:
      typeof fields.description === "string" ? fields.description.trim() : "",
    orderIndex: toNum(fields.orderIndex, 0),
    isPublic: toBool(fields.isPublic),
  };

  const fd = new FormData();
  fd.append("data", JSON.stringify(payload));

  if (fields.video instanceof File || fields.video instanceof Blob) {
    fd.append("video", fields.video);
  }

  const headers = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const cid = encodeURIComponent(String(courseId).trim());
  const url = `/api/courses/${cid}/lectures/with-video`;

  try {
    const res = await api.post(url, fd, {
      headers,
      signal: opts.signal,
      onUploadProgress: (evt) => {
        if (typeof opts.onProgress === "function" && evt?.total) {
          const percent = Math.round((evt.loaded * 100) / evt.total);
          opts.onProgress(percent);
        }
      },
    });

    // 서버 예시 응답:
    // { status, success, message, data: { id, courseId, title, description, durationSec, videoUrl, progress } }
    const d = res?.data?.data ?? {};

    return {
      id: toNum(d?.id, 0),
      courseId: toNum(d?.courseId, toNum(courseId)),
      title: d?.title ?? payload.title,
      description: d?.description ?? payload.description,
      durationSec: toNum(d?.durationSec, 0),
      videoUrl: d?.videoUrl ?? null,
      progress: clamp01(d?.progress ?? 0),
      // 서버가 orderIndex를 내려주면 사용, 아니면 요청 값 사용
      orderIndex: toNum(d?.orderIndex, payload.orderIndex),
    };
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "강의 영상 등록에 실패했습니다.";
    throw new Error(msg);
  }
}

export async function deleteLecture(lectureId, opts = {}) {
  if (
    lectureId === undefined ||
    lectureId === null ||
    String(lectureId).trim() === ""
  ) {
    throw new Error("유효한 lectureId가 필요합니다.");
  }

  const headers = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const lid = encodeURIComponent(String(lectureId).trim());
  const url = `/api/lectures/${lid}`;

  try {
    await api.delete(url, { headers, signal: opts.signal });
    // 응답: ApiResponse<Void>, data=null
    return true;
  } catch (err) {
    // 상태코드별 친화적 메시지
    const status = err?.response?.status;
    let msg =
      err?.response?.data?.message ||
      err?.message ||
      "강의 삭제에 실패했습니다.";

    if (status === 404) msg = "해당 강의를 찾을 수 없습니다.";
    if (status === 401) msg = "인증이 필요합니다.";
    if (status === 403) msg = "권한이 없습니다(ADMIN 전용).";

    throw new Error(msg);
  }
}

export async function getLectureDetail(lectureId, opts = {}) {
  if (
    lectureId === undefined ||
    lectureId === null ||
    String(lectureId).trim() === ""
  ) {
    throw new Error("유효한 lectureId가 필요합니다.");
  }

  const headers = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const lid = encodeURIComponent(String(lectureId).trim());
  const url = `/api/lectures/${lid}`;

  const toNum = (v, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  const clamp01 = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
  };

  try {
    const res = await api.get(url, { headers, signal: opts.signal });
    // 서버 응답: { status, success, message, data: LectureDetailDto }
    const d = res?.data?.data ?? {};

    return {
      id: toNum(d?.id, 0),
      courseId: toNum(d?.courseId, 0),
      title: d?.title ?? "",
      description: d?.description ?? null,
      durationSec: toNum(d?.durationSec, 0),
      videoUrl: d?.videoUrl ?? null,
      progress: clamp01(d?.progress ?? 0),
      orderIndex: toNum(d?.orderIndex, 0),
      // 서버가 isPublic/public 필드를 줄 수도 있으니 방어적으로 매핑
      isPublic:
        typeof d?.isPublic === "boolean"
          ? d.isPublic
          : typeof d?.public === "boolean"
          ? d.public
          : undefined,
    };
  } catch (err) {
    const status = err?.response?.status;
    let msg =
      err?.response?.data?.message ||
      err?.message ||
      "강의 정보를 불러오지 못했습니다.";
    if (status === 404) msg = "해당 강의를 찾을 수 없습니다.";
    if (status === 401) msg = "인증이 필요합니다.";
    if (status === 403) msg = "권한이 없습니다.";
    throw new Error(msg);
  }
}