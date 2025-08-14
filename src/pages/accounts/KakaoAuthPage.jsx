// src/pages/accounts/KakaoAuthPage.jsx
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { setUser, setHydrated } from "../../services/auth/authSlice";

export default function KakaoAuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/auth/me");
        const user = res.data?.data;
        dispatch(setUser(user));
        dispatch(setHydrated(true));

        // 원래 가려던 경로 복귀 로직이 있으면 사용
        const next = sessionStorage.getItem("returnTo");
        sessionStorage.removeItem("returnTo");
        navigate(next && next.startsWith("/mypage") ? next : "/mypage", {
          replace: true,
        });
      } catch {
        navigate("/account/login?error=auth_failed", { replace: true });
      }
    })();
  }, [dispatch, navigate]);

  return <div>카카오 회원가입 처리중...</div>;
}
