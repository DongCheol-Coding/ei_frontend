import axios from "axios";
import { api } from "../api/basicApi";

const BASE_URL = import.meta.env.VITE_API_SERVER_HOST;

export async function signup({ email, password, name, phone }) {
  const requestUrl = `${BASE_URL}/api/auth/signup`;

  try {
    const res = await axios.post(
      requestUrl,
      { email, password, name, phone },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    const body = res.data;

    if (!body || typeof body !== "object") {
      if (res.status >= 200 && res.status < 300) {
        // 서버가 바디 없이 200을 주는 경우
        return null; // 필요하면 {}로 바꿔 사용
      }
      throw new Error(`예상치 못한 응답 형식 (HTTP ${res.status})`);
    }

    if (body.status === 200) {
      console.log("회원가입 요청 완료", body.data);
      return body.data;
    }
    // 200이 아닌 경우
    throw new Error("이메일 또는 비밀번호가 잘못되었습니다.");
  } catch (err) {
    if (err.response.status === 400) {
      throw new Error("전화번호가 양식에 맞지 않습니다.");
    }
    if (err.response.status === 409) {
      throw new Error("이미 가입된 이메일입니다.");
    }
    if (err.response.status === 500) {
      throw new Error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
    throw new Error(err.response.data.error || "회원가입에 실패하였습니다.");
  }
}
export async function login({ email, password }) {
  try {
    // ★ 쿠키는 Set-Cookie로 자동 저장됨. 바디 토큰은 쓰지 않음.
    await api.post("/api/auth/login", { email, password });
    // 성공 여부만 알면 됨. 사용자 정보는 /me에서 가져옴.
    return true;
  } catch (err) {
    if (!axios.isAxiosError(err) || !err.response) {
      if (err.code === "ECONNABORTED")
        throw new Error(
          "요청이 시간 초과되었습니다. 잠시 후 다시 시도해주세요."
        );
      throw new Error("네트워크/CORS 오류로 서버 응답을 받지 못했습니다.");
    }
    if (err.response.status === 401)
      throw new Error("이메일 또는 비밀번호가 잘못되었습니다.");
    if (err.response.status === 400)
      throw new Error("요청 형식이 올바르지 않습니다.");
    if (err.response.status >= 500)
      throw new Error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    throw new Error("로그인에 실패하였습니다.");
  }
}

export default { signup, login };
