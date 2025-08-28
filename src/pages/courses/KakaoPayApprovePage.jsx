import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { approveKakaoPay } from "../../services/api/kakaoPayApi";

export default function KakaoPayApprovePage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId"); // 예: f4de9214-...
  const pgToken = searchParams.get("pg_token"); // 예: 89dae2401f3...

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const calledRef = useRef(false); // StrictMode 이중 호출 방지
  const navigate = useNavigate();

  useEffect(() => {
    if (calledRef.current) return;
    if (!orderId || !pgToken) return; // 필수 파라미터 체크
    calledRef.current = true;

    (async () => {
      try {
        setLoading(true);
        const message = await approveKakaoPay({ orderId, pgToken });
        setMsg(message || "결제가 완료되었습니다.");

        navigate("/mypage/ingcourse", { replace: true });
        toast.success("결제가 정상처리 되었습니다.");
      } catch (e) {
        setMsg(e.message ?? "결제 승인에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, pgToken, navigate]);

  if (!orderId || !pgToken) {
    return (
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-bold mb-3">카카오페이 결제 승인</h1>
        <p className="text-red-600">
          필수 파라미터 누락: orderId 또는 pg_token 이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-bold mb-3">카카오페이 결제 승인</h1>
      {loading ? (
        <p>승인 처리 중입니다...</p>
      ) : (
        <>
          <p className="mb-4">{msg || "처리 완료"}</p>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded bg-black text-white"
              onClick={() => navigate("/", { replace: true })}
            >
              홈으로
            </button>
          </div>
        </>
      )}
    </div>
  );
}
