import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import LoadingPage from "../../pages/common/LoadingPage";
import { selectIsAuth, selectHydrated } from "../../services/auth/authSlice";

const DEFAULT_ALLOWED = ["ROLE_ADMIN", "ROLE_SUPPORT"];

export default function RequireAdminAuth({
  // 로그인 안 된 경우 보낼 경로 (예: 로그인 페이지)
  loginRedirect = "/",
  // 권한 없는 경우 보낼 경로
  unauthorizedRedirect = "/",
  // 허용할 롤
  allowedRoles = DEFAULT_ALLOWED,
}) {
  const isAuth = useSelector(selectIsAuth);
  const hydrated = useSelector(selectHydrated);
  const roles = useSelector((s) => s.auth?.user?.roles ?? []);
  const location = useLocation();

  // 인증 전 로딩
  if (!hydrated) return <LoadingPage />;

  // 비로그인: 원래 가려던 경로 저장 후 로그인 경로로
  if (!isAuth) {
    sessionStorage.setItem("returnTo", location.pathname + location.search);
    return <Navigate to={loginRedirect} replace />;
  }

  // 로그인은 돼있지만 권한 없음: "/" 등으로 차단
  const hasAccess = roles.some((r) => allowedRoles.includes(r));
  return hasAccess ? (
    <Outlet />
  ) : (
    <Navigate to={unauthorizedRedirect} replace />
  );
}
