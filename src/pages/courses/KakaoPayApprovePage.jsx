// src/pages/KakaoPayApprovePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { approveKakaoPay } from "../../services/api/kakaoPayApi";

export default function KakaoPayApprovePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pgToken = useMemo(() => searchParams.get("pg_token"), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      if (!pgToken) {
        setError("pg_token 이 없어 결제를 승인할 수 없습니다.");
        setLoading(false);
        return;
      }
      try {
        // 현재 서버 구조상 pg_token만으로 승인 가능
        await approveKakaoPay({ pgToken }, { signal: ac.signal });
        navigate("/mypage", { replace: true });
      } catch (e) {
        setError(e?.message || "결제 승인 실패");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [pgToken, navigate]);

  if (loading)
    return <div className="p-6 text-center">결제 승인 중입니다...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  return null;
}
