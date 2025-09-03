import axios from "axios";
import { store } from "../../store";
import { logout } from "../auth/authSlice";

/* [설정]
 * - HttpOnly 쿠키 기반 (AT/RT) 사용
 * - XSRF-TOKEN 자동 헤더 전송
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_SERVER_HOST,
  withCredentials: true,
  timeout: 10000,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

/* [상태 플래그] */
let isLoggingOut = false;
/* [동시성 제어: RT 재발급 중일 때 중복 호출 방지] */
let refreshPromise = null;

/* [스킵 경로]
 * - 401이 떠도 재발급/로그아웃 로직을 태우지 않을 API
 * - 재발급 자체(/api/auth/reissue) 포함
 */
const SKIP_401_PATHS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/me",
  "/api/auth/logout",
  "/api/auth/reissue",
];

/* [만료 신호 판별] */
function isAuthExpired(response) {
  const code = response?.data?.code || response?.data?.error;
  const msg = String(response?.data?.message ?? "");
  const www = String(response?.headers?.["www-authenticate"] ?? "");
  return (
    /EXPIRED/i.test(code) || // e.g. TOKEN_EXPIRED
    /expired|만료/i.test(msg) || // 'expired', '만료' 포함
    /invalid_token/i.test(www) // RFC6750: Bearer error="invalid_token"
  );
}

/* [재발급 호출]
 * - 같은 순간에는 1회만 네트워크 호출하도록 Promise 공유
 * - 백엔드 매핑이 다르면 아래 REISSUE_URL만 맞춰주세요.
 */
const REISSUE_URL = "/api/auth/reissue";
function reissueAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api
      .post(REISSUE_URL) // RT 쿠키 검증 → 새 AT를 Set-Cookie로 재설정
      .finally(() => {
        // 다음 401 때를 위해 초기화
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/* [강제 로그아웃 + 리다이렉트] */
function logoutAndRedirect(message = "세션이 만료되어 로그아웃되었습니다.") {
  if (isLoggingOut) return;
  isLoggingOut = true;
  try {
    const here = window.location.pathname + window.location.search;
    if (!/\/account\/login/.test(here)) {
      sessionStorage.setItem("returnTo", here);
    }
    alert(message);
    store.dispatch(logout());
    window.location.replace("/account/loginchoice");
  } finally {
    setTimeout(() => {
      isLoggingOut = false;
    }, 1500);
  }
}

/* [응답 인터셉터]
 * 흐름: 401 발생 → (스킵 제외 & 로그인 상태)면 RT로 재발급 시도
 *   - 재발급 성공: 원요청을 1회 재시도
 *   - 재발급 실패(또는 RT 만료): 로그아웃
 *   - 무한 루프 방지: config._retry 플래그
 */
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
      const hydrated = !!state?.auth?.hydrated;
      const isAuth = !!state?.auth?.isAuthenticated;

      // 로그인 상태가 아니거나 초기화 전이면 굳이 재발급 시도하지 않음
      if (!hydrated || !isAuth) {
        return Promise.reject(error);
      }

      // 이미 재시도 했는데도 또 401이면 중단 → 로그아웃 처리
      if (config._retry) {
        if (isAuthExpired(response)) {
          logoutAndRedirect("로그인이 만료되었습니다. 다시 로그인해 주세요.");
        }
        return Promise.reject(error);
      }

      try {
        // RT로 AT 재발급 (동시성 안전)
        await reissueAccessToken();

        // 재발급 성공 시, 원요청 1회 재시도
        config._retry = true;
        return api(config);
      } catch (e) {
        // 재발급 실패: RT 없거나 만료/무효 → 로그아웃
        logoutAndRedirect("자동 로그인이 만료되어 로그아웃되었습니다.");
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
