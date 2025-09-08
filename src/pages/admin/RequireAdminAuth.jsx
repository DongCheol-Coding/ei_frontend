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
  // 허용할 이메일
  allowedEmails,
}) {
  const isAuth = useSelector(selectIsAuth);
  const hydrated = useSelector(selectHydrated);
  const user = useSelector((s) => s.auth?.user ?? null);
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const email = String(user?.email ?? "")
    .trim()
    .toLowerCase();
  const location = useLocation();

  // 인증 전 로딩
  if (!hydrated) return <LoadingPage />;

  // 비로그인: 원래 가려던 경로 저장 후 로그인 경로로
  if (!isAuth) {
    const returnTo = location.pathname + location.search + location.hash;
    sessionStorage.setItem("returnTo", returnTo);
    return <Navigate to={loginRedirect} replace />;
  }

  // --- 이메일 값이 있으면 이메일 체크 모드 ---
  if (Array.isArray(allowedEmails) && allowedEmails.length > 0) {
    const normalized = allowedEmails.map((e) => String(e).trim().toLowerCase());
    const hasAccess = normalized.includes(email);
    return hasAccess ? (
      <Outlet />
    ) : (
      <Navigate to={unauthorizedRedirect} replace />
    );
  }

  // --- 이메일이 값이 없으면 ROLE만 체크 모드 ---
  const roleOk = roles.some((r) => DEFAULT_ALLOWED.includes(r));
  return roleOk ? <Outlet /> : <Navigate to={unauthorizedRedirect} replace />;
}
