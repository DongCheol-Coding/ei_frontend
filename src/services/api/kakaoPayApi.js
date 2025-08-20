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