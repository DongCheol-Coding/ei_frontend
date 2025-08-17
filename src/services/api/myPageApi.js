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
