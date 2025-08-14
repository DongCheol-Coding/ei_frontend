// src/routes/RequireAuth.jsx
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import LoadingPage from "../../pages/common/LoadingPage";
import { selectIsAuth, selectHydrated } from "../../services/auth/authSlice";

export default function RequireAuth({ redirectTo = "/" }) {
  const isAuth = useSelector(selectIsAuth);
  const hydrated = useSelector(selectHydrated);
  const location = useLocation();

  useEffect(() => {
    if (hydrated && !isAuth) {
      sessionStorage.setItem("returnTo", location.pathname + location.search);
    }
  }, [hydrated, isAuth, location]);

  if (!hydrated) return <LoadingPage />; // 인증 상태 확인 중

  return isAuth ? <Outlet /> : <Navigate to={redirectTo} replace />;
}
