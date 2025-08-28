// src/pages/accounts/KakaoAuthPage.jsx
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../services/api/basicApi";
import { setUser, setHydrated } from "../../services/auth/authSlice";
import { toast } from "../../components/ui/useToast";

export default function KakaoAuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // 진행률/상태/에러
  const [progress, setProgress] = useState(12);
  const [status, setStatus] = useState("로그인 인증 확인 중...");
  const [error, setError] = useState("");

  // 중복 네비게이션 방지
  const doneRef = useRef(false);

  useEffect(() => {
    // 1) 진행률/상태를 부드럽게 갱신 (최대 95%까지만)
    const intervalId = setInterval(() => {
      setProgress((p) => {
        if (doneRef.current) return p;
        const next = Math.min(p + Math.max(1, Math.round((95 - p) * 0.08)), 95);
        if (next < 30) setStatus("카카오 로그인 인증 확인 중...");
        else if (next < 65) setStatus("세션 설정 및 사용자 정보 동기화...");
        else setStatus("대시보드로 이동 준비 중...");
        return next;
      });
    }, 200);

    // 2) 실제 인증 확인
    (async () => {
      try {
        const res = await api.get("/api/auth/me"); // HttpOnly 쿠키 기반 세션 확인
        const user = res.data?.data;
        dispatch(setUser(user));
        dispatch(setHydrated(true));

        doneRef.current = true;
        setProgress(100);
        setStatus("카카오 로그인 성공! 이동합니다...");

        const next = sessionStorage.getItem("returnTo");
        sessionStorage.removeItem("returnTo");

        setTimeout(() => {
          navigate(next && next.startsWith("/mypage") ? next : "/mypage", {
            replace: true,
          });
        }, 500);
        toast.success("성공적으로 로그인 되었습니다.");
      } catch (e) {
        console.log("로그인 실패 : ", e);
        doneRef.current = true;
        setError("인증에 실패했습니다. 다시 로그인해 주세요.");
        setStatus("카카오 로그인 실패");
        setProgress(0);

        // 1.2초 후 로그인 화면으로
        setTimeout(() => {
          const qs = new URLSearchParams(location.search);
          qs.set("error", "auth_failed");
          navigate(`/account/login}`, { replace: true });
        }, 1200);
      }
    })();

    return () => clearInterval(intervalId);
  }, [dispatch, navigate, location.search]);

  // 작은 팁 문구 (3초마다 회전)
  const tips = [
    "팁: 로그인 후 마이페이지에서 프로필을 완성해 보세요.",
    "팁: 브라우저의 서드파티 쿠키 차단이 로그인에 영향을 줄 수 있어요.",
    "팁: 창을 닫지 말고 잠시만 기다려 주세요.",
  ];
  const tip = tips[Math.floor((Date.now() / 3000) % tips.length)];

  return (
    <div className="min-h-[calc(100vh-98px)] grid place-items-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {/* 헤더 + 스피너 */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-gray-200 grid place-items-center">
            <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
          </div>
          <h1 className="text-lg font-semibold">카카오 로그인 처리중</h1>
        </div>

        {/* 상태 문구 (스크린리더 공지) */}
        <p className="mt-3 text-sm text-gray-600" aria-live="polite">
          {status}
        </p>

        {/* 진행 바 */}
        <div className="mt-4 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="로그인 진행률"
          />
        </div>

        {/* 회전 팁 */}
        <div className="mt-3 text-xs text-gray-400">{tip}</div>

        {/* 에러 노출 + 즉시 이동 버튼 */}
        {error && (
          <div className="mt-4 text-sm text-red-600">
            {error}
            <div className="mt-2">
              <button
                onClick={() => navigate("/account/login", { replace: true })}
                className="px-3 py-1.5 text-xs border rounded-md"
              >
                로그인 화면으로 이동
              </button>
            </div>
          </div>
        )}

        {/* 헬프 텍스트 */}
        <div className="mt-6 text-xs text-gray-400">
          계속 문제가 발생하면 쿠키/스토리지 삭제 후 다시 시도해 주세요.
        </div>
      </div>
    </div>
  );
}
