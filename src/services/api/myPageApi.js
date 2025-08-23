import axios from "axios";
import { api } from "../api/basicApi";

export async function getMyPage(opts = {}) {
  try {
    const res = await api.get("/api/my-page", { signal: opts.signal });
    const body = res?.data;

    if (!body || typeof body !== "object") {
      if (res.status >= 200 && res.status < 300) {
        // 서버가 바디 없이 200을 주는 경우
        return null; // 필요하면 {}로 바꿔 사용
      }
      throw new Error(`예상치 못한 응답 형식 (HTTP ${res.status})`);
    }

    // 응답 기본 검증
    if (!body || typeof body !== "object") {
      throw new Error("서버 응답 형식이 올바르지 않습니다.");
    }
    const data = body.data ?? {};
    return {
      user: data.user ?? null,
      payments: Array.isArray(data.payments) ? data.payments : [],
      coursesProgress: Array.isArray(data.coursesProgress)
        ? data.coursesProgress
        : [],
    };
  } catch (err) {
    // 네트워크/CORS 등으로 response 자체가 없는 경우
    if (!err?.response) {
      throw new Error(
        "네트워크/CORS 오류로 마이페이지 정보를 받지 못했습니다."
      );
    }
    // 401 등의 인증 오류는 basicApi 인터셉터에서 공통 처리됨(로그아웃/리다이렉트)
    throw err;
  }
}

export async function changePassword(newPassword, opts = {}) {
  try {
    const res = await api.patch(
      "/api/auth/password",
      { newPassword: newPassword.trim() },
      {
        signal: opts.signal,
      }
    );

    const body = res?.data;

    // 바디 없이 200만 오는 경우까지 허용
    if (!body || typeof body !== "object") {
      if (res.status >= 200 && res.status < 300) return true;
      throw new Error(`예상치 못한 응답 형식 (HTTP ${res.status})`);
    }

    // 서버 응답 포맷: { status:200, success:true, message, data }
    if (body.status === 200 || body.success === true) {
      return body.data ?? true; // 성공 시 true 반환
    }

    throw new Error(body?.message || "비밀번호 변경에 실패했습니다.");
  } catch (err) {
    // 네트워크/CORS 등으로 response 자체가 없는 경우
    if (!err?.response) {
      throw new Error("네트워크/CORS 오류로 비밀번호를 변경하지 못했습니다.");
    }
    // 401 등 인증 오류는 basicApi 인터셉터에서 공통 처리
    throw err;
  }
}

export async function deleteAccount(opts = {}) {
  try {
    // 바디 없이 DELETE 요청
    const res = await api.delete("/api/auth/account", { signal: opts.signal });
    const body = res?.data;

    // 바디 없이 200만 오는 경우까지 허용
    if (!body || typeof body !== "object") {
      if (res.status >= 200 && res.status < 300) {
        return "계정이 삭제(탈퇴) 처리되었습니다.";
      }
      throw new Error(`예상치 못한 응답 형식 (HTTP ${res.status})`);
    }

    // 서버 응답 포맷: { status:200, success:true, message, data }
    const ok = body.status === 200 || body.success === true;
    if (ok) {
      return (
        (typeof body.message === "string" && body.message.trim()) ||
        "계정이 삭제(탈퇴) 처리되었습니다."
      );
    }

    throw new Error(body?.message || "회원 탈퇴에 실패했습니다.");
  } catch (err) {
    // 네트워크/CORS 등으로 response 자체가 없는 경우
    if (!err?.response) {
      throw new Error("네트워크/CORS 오류로 회원 탈퇴 요청에 실패했습니다.");
    }
    // 401 등 인증 오류는 basicApi 인터셉터에서 공통 처리
    throw err;
  }
}

export async function getMyPayments(argOrOpts = {}) {
  // 인자 정규화: 문자열이면 토큰으로 간주, 객체면 { accessToken|token, signal } 사용
  let token = null;
  let signal;
  if (typeof argOrOpts === "string") {
    token = argOrOpts;
  } else if (argOrOpts && typeof argOrOpts === "object") {
    token = argOrOpts.accessToken ?? argOrOpts.token ?? null;
    signal = argOrOpts.signal;
  }

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await api.get("/api/payment/me", { headers, signal });
    const body = res?.data;

    // 바디 없이 200만 오는 경우까지 허용 → 빈 배열 반환
    if (!body || typeof body !== "object") {
      if (res.status >= 200 && res.status < 300) return [];
      throw new Error(`예상치 못한 응답 형식 (HTTP ${res.status})`);
    }

    // 서버 표준 포맷: { status, success, message, data }
    const ok = body.status === 200 || body.success === true;
    if (!ok)
      throw new Error(body?.message || "결제 내역을 가져오지 못했습니다.");

    const list = Array.isArray(body.data) ? body.data : [];

    // 응답 정규화(숫자는 number로 변환, 문자열 기본값 지정)
    return list.map((p) => ({
      courseId: p?.courseId != null ? Number(p.courseId) : null,
      courseName: typeof p?.courseName === "string" ? p.courseName : "",
      price: p?.price != null ? Number(p.price) : null,
      paymentDate: typeof p?.paymentDate === "string" ? p.paymentDate : null,
    }));
  } catch (err) {
    if (!err?.response) {
      throw new Error("네트워크/CORS 오류로 결제 내역을 가져오지 못했습니다.");
    }
    // 401 등 인증 오류는 basicApi 인터셉터에서 공통 처리
    throw err;
  }
}

// [수정됨] imageUrl만 사용하도록 응답 정규화 간소화
export async function getMyCourses(argOrOpts = {}) {
  // 인자 정규화
  let token = null;
  let signal;
  if (typeof argOrOpts === "string") {
    token = argOrOpts;
  } else if (argOrOpts && typeof argOrOpts === "object") {
    token = argOrOpts.accessToken ?? argOrOpts.token ?? null;
    signal = argOrOpts.signal;
  }

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await api.get("/api/course/me", { headers, signal });
    const body = res?.data;

    // 바디 없이 2xx만 오는 경우까지 허용 → 빈 배열 반환
    if (!body || typeof body !== "object") {
      if (res.status >= 200 && res.status < 300) return [];
      throw new Error(`예상치 못한 응답 형식 (HTTP ${res.status})`);
    }

    // 표준 포맷 체크
    const ok = body.status === 200 || body.success === true;
    if (!ok)
      throw new Error(body?.message || "코스 목록을 가져오지 못했습니다.");

    const list = Array.isArray(body?.data?.content) ? body.data.content : [];

    // imageUrl만 사용
    return list.map((c) => ({
      courseId: c?.courseId != null ? Number(c.courseId) : null,
      courseTitle: typeof c?.courseTitle === "string" ? c.courseTitle : "",
      imageUrl:
        typeof c?.imageUrl === "string" && c.imageUrl.trim()
          ? c.imageUrl.trim()
          : null,
      progress:
        c?.progress != null && !Number.isNaN(Number(c.progress))
          ? Number(c.progress)
          : 0,
      completedCount:
        c?.completedCount != null && !Number.isNaN(Number(c.completedCount))
          ? Number(c.completedCount)
          : 0,
      totalCount:
        c?.totalCount != null && !Number.isNaN(Number(c.totalCount))
          ? Number(c.totalCount)
          : 0,
    }));
  } catch (err) {
    if (!err?.response) {
      throw new Error("네트워크/CORS 오류로 코스 목록을 가져오지 못했습니다.");
    }
    throw err;
  }
}
