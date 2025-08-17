import axios from "axios";
import { store } from "../../store";
import { logout } from "../auth/authSlice";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_SERVER_HOST,
  withCredentials: true,
  timeout: 10000,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

let isLoggingOut = false;

const SKIP_401_PATHS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/me",
  "/api/auth/logout",
];

// 서버가 “만료”를 알려주는지 판별
function isAuthExpired(response) {
  const code = response?.data?.code || response?.data?.error;
  const msg = String(response?.data?.message ?? "");
  const www = String(response?.headers?.["www-authenticate"] ?? "");
  return (
    /EXPIRED/i.test(code) || // e.g. TOKEN_EXPIRED
    /expired|만료/i.test(msg) || // message에 'expired', '만료'
    /invalid_token/i.test(www) // RFC6750: WWW-Authenticate: Bearer error="invalid_token"
  );
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const status = response?.status;
    const url = config?.url || "";

    if (!config || !status) return Promise.reject(error);

    const skip = SKIP_401_PATHS.some((p) => url.includes(p));

    if (status === 401 && !skip) {
      const state = store.getState();
      // ⚠️ 키 이름은 프로젝트와 맞추세요: isAuthenticated / isAuth 등
      const hydrated = !!state?.auth?.hydrated;
      const isAuth = !!state?.auth?.isAuthenticated;

      // 1) 로그인되어 있다고 알고 있고, 서버가 "만료"라고 말할 때만 강제 로그아웃
      if (hydrated && isAuth && isAuthExpired(response) && !isLoggingOut) {
        isLoggingOut = true;
        try {
          const here = window.location.pathname + window.location.search;
          if (!/\/account\/login/.test(here)) {
            sessionStorage.setItem("returnTo", here);
          }
          alert("토큰이 만료되어 로그아웃되었습니다.");
          store.dispatch(logout());
          window.location.replace("/account/loginchoice");
        } finally {
          setTimeout(() => {
            isLoggingOut = false;
          }, 1500);
        }
      }
    }

    return Promise.reject(error);
  }
);
