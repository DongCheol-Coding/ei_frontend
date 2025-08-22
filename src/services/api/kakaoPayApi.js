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

export async function approveKakaoPay(
  { pgToken, cid, tid, partnerOrderId, partnerUserId } = {},
  opts = {}
) {
  if (!pgToken || typeof pgToken !== "string") {
    throw new Error("pg_token 이 필요합니다.");
  }

  // JSON 본문 + 쿼리스트링 동시에 전달(@RequestBody / @RequestParam 모두 대응)
  const json = {
    pg_token: pgToken,
    ...(cid && { cid }),
    ...(tid && { tid }),
    ...(partnerOrderId && { partner_order_id: partnerOrderId }),
    ...(partnerUserId && { partner_user_id: partnerUserId }),
  };

  try {
    const res = await api.post("/api/payment/approve", json, {
      withCredentials: true,
      signal: opts.signal,
      headers: { "Content-Type": "application/json" },
      // 쿼리스트링으로도 전달(@RequestParam 대응)
      params: { pg_token: pgToken },
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

    // 폴백: 서버가 x-www-form-urlencoded만 받는 경우 재시도
    if (msg.includes("pg_token") || msg.includes("파라미터")) {
      const form = new URLSearchParams();
      form.set("pg_token", pgToken);
      if (cid) form.set("cid", cid);
      if (tid) form.set("tid", tid);
      if (partnerOrderId) form.set("partner_order_id", partnerOrderId);
      if (partnerUserId) form.set("partner_user_id", partnerUserId);

      try {
        const res2 = await api.post("/api/payment/approve", form, {
          withCredentials: true,
          signal: opts.signal,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        const body2 = res2?.data;
        const message2 =
          body2?.data ||
          body2?.message ||
          (typeof body2 === "string" ? body2 : "결제가 완료되었습니다.");
        return message2;
      } catch (err2) {
        const msg2 =
          err2?.response?.data?.message ||
          err2?.message ||
          "결제 승인에 실패했습니다.";
        throw new Error(msg2);
      }
    }

    throw new Error(msg);
  }
}
