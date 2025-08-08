import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_SERVER_HOST;

export async function signup({ email, password, name, phone }) {
  const requestUrl = `${BASE_URL}/api/auth/signup`;

  try {
    const { data } = await axios.post(
      requestUrl,
      { email, password, name, phone },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    console.log("회원가입 요청 완료", data);
    return data;
  } catch (err) {
    if (err.response.status === 401) {
      throw new Error("이미 가입 된 Email입니다.");
    }
    if (err.response.status === 500) {
      throw new Error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
    throw new Error(err.response.data.error || "회원가입에 실패하였습니다.");
  }
}

export default { signup };
