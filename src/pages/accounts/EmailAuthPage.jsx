import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../services/api/basicApi";
import { setUser, setHydrated } from "../../services/auth/authSlice";

function extractAccessToken(loc) {
  const qs = new URLSearchParams(loc.search || "");
  const fromQuery =
    qs.get("at") || qs.get("access_token") || qs.get("token") || "";
  if (fromQuery) return fromQuery;

  const hash = (loc.hash || "").replace(/^#/, "");
  if (!hash) return "";
  const hs = new URLSearchParams(hash);
  return hs.get("at") || hs.get("access_token") || hs.get("token") || "";
}

function stripTokenFromUrl() {
  const url = new URL(window.location.href);
  ["at", "access_token", "token"].forEach((k) => url.searchParams.delete(k));
  if (url.hash) {
    const raw = url.hash.replace(/^#/, "");
    const hs = new URLSearchParams(raw);
    ["at", "access_token", "token"].forEach((k) => hs.delete(k));
    const newHash = hs.toString();
    url.hash = newHash ? `#${newHash}` : "";
  }
  window.history.replaceState(null, "", url.toString());
}

export default function EmailAuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [progress, setProgress] = useState(12);
  const [status, setStatus] = useState("이메일 로그인 인증 확인 중...");
  const [error, setError] = useState("");

  // 진행 애니메이션 종료 제어
  const doneRef = useRef(false);

  useEffect(() => {
    // 혹시 설정돼 있을 수 있는 전역 Authorization 제거(무저장 보장)
    delete api.defaults?.headers?.common?.Authorization;

    const intervalId = setInterval(() => {
      setProgress((p) => {
        if (doneRef.current) return p;
        const next = Math.min(p + Math.max(1, Math.round((95 - p) * 0.08)), 95);
        if (next < 30) setStatus("이메일 인증 토큰 확인 중...");
        else if (next < 65) setStatus("세션 설정 및 사용자 정보 동기화...");
        else setStatus("대시보드로 이동 준비 중...");
        return next;
      });
    }, 200);

    (async () => {
      try {
        setError("");

        const at = extractAccessToken(location);
        if (!at) throw new Error("토큰이 없습니다.");
        stripTokenFromUrl();

        const res = await api.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${at}` },
          withCredentials: true,
        });

        const user = res?.data?.data ?? res?.data ?? null;
        if (!user) throw new Error("사용자 정보를 불러오지 못했습니다.");

        dispatch(setUser(user));
        dispatch(setHydrated(true));

        doneRef.current = true;
        setProgress(100);
        setStatus("이메일 로그인 성공! 이동합니다...");

        const next = sessionStorage.getItem("returnTo");
        sessionStorage.removeItem("returnTo");
        setTimeout(() => {
          navigate(next && next.startsWith("/mypage") ? next : "/mypage", {
            replace: true,
          });
        }, 500);
      } catch (e) {
        console.error(e);
        doneRef.current = true;
        setError("인증에 실패했습니다. 다시 로그인해 주세요.");
        setStatus("이메일 로그인 실패");
        setProgress(0);

        setTimeout(() => {
          const qs = new URLSearchParams(location.search);
          qs.set("error", "auth_failed");
          navigate(`/account/login?${qs.toString()}`, { replace: true });
        }, 1200);
      }
    })();

    return () => clearInterval(intervalId);
  }, [dispatch, navigate, location]);

  const tips = [
    "팁: 로그인 후 마이페이지에서 프로필을 완성해 보세요.",
    "팁: 브라우저의 서드파티 쿠키 차단이 로그인에 영향을 줄 수 있어요.",
    "팁: 창을 닫지 말고 잠시만 기다려 주세요.",
  ];
  const tip = tips[Math.floor((Date.now() / 3000) % tips.length)];

  return (
    <div className="min-h-[calc(100vh-98px)] grid place-items-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-gray-200 grid place-items-center">
            <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
          </div>
          <h1 className="text-lg font-semibold">이메일 로그인 처리중</h1>
        </div>

        <p className="mt-3 text-sm text-gray-600" aria-live="polite">
          {status}
        </p>

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

        <div className="mt-3 text-xs text-gray-400">{tip}</div>

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

        <div className="mt-6 text-xs text-gray-400">
          계속 문제가 발생하면 쿠키/스토리지 삭제 후 다시 시도해 주세요.
        </div>
      </div>
    </div>
  );
}
