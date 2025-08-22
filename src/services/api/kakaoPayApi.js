import { api } from "../api/basicApi";

export async function readyKakaoPay(courseId, opts = {}) {
  const id = Number(courseId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("유효한 courseId가 필요합니다.");
  }

  try {
    const res = await api.post(
      "/api/payment/ready",
      null, // 본문 없음 (@RequestParam 사용)
      {
        params: { courseId: id },
        withCredentials: true, // 쿠키 AT 인증
        signal: opts.signal,
      }
    );

    const body = res?.data;

    // ApiResponse<String> 형태 또는 순수 string 모두 대응
    const url =
      (typeof body === "string" && body) ||
      body?.data ||
      body?.nextRedirectPcUrl ||
      body?.url;

    if (!url || typeof url !== "string") {
      throw new Error("결제 리다이렉트 URL을 파싱할 수 없습니다.");
    }
    return url;
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "카카오페이 결제 준비에 실패했습니다.";
    throw new Error(msg);
  }
}

export async function approveKakaoPay({ pgToken } = {}, opts = {}) {
  if (!pgToken || typeof pgToken !== "string") {
    throw new Error("pg_token 이 필요합니다.");
  }

  const payload = {
    pg_token: pgToken,
  };

  try {
    const res = await api.post("/api/payment/approve", payload, {
      withCredentials: true,
      signal: opts.signal,
      headers: { "Content-Type": "application/json" },
      // params: undefined, // 혹시 기본 params가 섞여 들어가는 걸 명시적으로 차단하고 싶다면 주석 해제
    });

    const body = res?.data;
    const message =
      body?.data ||
      body?.message ||
      (typeof body === "string" ? body : "결제가 완료되었습니다.");
    return message;
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "결제 승인에 실패했습니다.";
    throw new Error(msg);
  }
}
