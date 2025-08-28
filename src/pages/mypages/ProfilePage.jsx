import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { changePassword, deleteAccount } from "../../services/api/myPageApi";
import { toast } from "../../components/ui/useToast";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useOutletContext();

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [delLoading, setDelLoading] = useState(false);

  const isSocialLogin = !!user?.social;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSocialLogin) {
      toast.warning("소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.");
      return;
    }

    if (pw.length < 8) {
      toast.warning("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (pw !== pw2) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setLoading(true);
      await changePassword(pw);
      toast.success("비밀번호가 변경되었습니다.");
      setPw("");
      setPw2("");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "비밀번호 변경에 실패했습니다.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (delLoading || loading) return;
    if (
      !window.confirm(
        "정말로 회원 탈퇴하시겠습니까?\n탈퇴 후 데이터는 복구할 수 없습니다."
      )
    )
      return;

    try {
      setDelLoading(true);

      // 1) 계정 삭제
      await deleteAccount();

      // 2) 서버 로그아웃(쿠키 만료; 실패해도 진행)
      try {
        await api.post("/api/auth/logout");
      } catch {}

      navigate("/", { replace: true });
      toast.success("로그아웃 되었습니다.");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "회원 탈퇴에 실패했습니다.";
      toast.error(msg);
    } finally {
      setDelLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-[24px] font-bold">프로필</h1>
      <div className="bg-gray-100 p-3 rounded">
        <div>
          <div className="font-bold">회원 정보</div>
          <div className="text-[15px] p-3">가입 이름:</div>
          <div className="text-[20px] font-bold px-6">{user?.name ?? "—"}</div>
          <div className="text-[15px] p-3">가입 이메일:</div>
          <div className="text-[20px] font-bold px-6">
            {" "}
            {user?.email ?? "—"}
          </div>
        </div>
      </div>
      <div className="bg-gray-100 p-3 mt-2 rounded">
        <div>
          <div className="font-bold">비밀번호 변경</div>
          <form onSubmit={handleSubmit}>
            <div className="p-3">
              <label htmlFor="password" className="block text-[15px] mb-3">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                placeholder={
                  isSocialLogin
                    ? "소셜 로그인 계정은 비밀번호 변경이 불가합니다."
                    : "특수문자, 숫자, 영문자 조합된 8 이상 문자"
                }
                className={[
                  "w-full h-10 px-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-sm",
                  isSocialLogin || loading
                    ? "opacity-60 cursor-not-allowed"
                    : "",
                ].join(" ")}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="new-password"
                disabled={isSocialLogin || loading}
                readOnly={isSocialLogin}
                required={!isSocialLogin}
              />
            </div>

            <div className="p-3">
              <label
                htmlFor="passwordConfirm"
                className="block text-[15px] mb-3"
              >
                비밀번호 확인
              </label>
              <input
                id="passwordConfirm"
                type="password"
                placeholder={
                  isSocialLogin
                    ? "소셜 로그인 계정은 비밀번호 변경이 불가합니다."
                    : "특수문자, 숫자, 영문자 조합된 8 이상 문자"
                }
                className={[
                  "w-full h-10 px-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-sm",
                  isSocialLogin || loading
                    ? "opacity-60 cursor-not-allowed"
                    : "",
                ].join(" ")}
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                autoComplete="new-password"
                disabled={isSocialLogin || loading}
                readOnly={isSocialLogin}
                required={!isSocialLogin}
              />
            </div>

            <div className="p-3 flex items-center justify-between">
              <button
                type="submit"
                disabled={loading || isSocialLogin}
                className={[
                  "px-3 py-2 text-sm text-white font-bold rounded-md",
                  isSocialLogin || loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 cursor-pointer",
                ].join(" ")}
                aria-disabled={loading || isSocialLogin}
                title={
                  isSocialLogin
                    ? "소셜 로그인 계정은 비밀번호 변경이 불가합니다."
                    : undefined
                }
              >
                {loading ? "요청 중.." : "비밀번호 변경"}
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={delLoading || loading}
                className={[
                  "px-3 py-2 text-sm rounded-md border border-gray-300",
                  delLoading || loading
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-400 hover:font-bold cursor-pointer",
                ].join(" ")}
              >
                {delLoading ? "탈퇴 처리중..." : "회원 탈퇴"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
