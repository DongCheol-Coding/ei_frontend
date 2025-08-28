import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TermsModal from "../../components/account/TermsModal";
import { signup } from "../../services/api/userApi";
import { toast } from "../../components/ui/useToast";

export default function EmailSignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [agreeAll, setAgreeAll] = useState(false);
  const [termsService, setTermsService] = useState(false);
  const [termsPrivacy, setTermsPrivacy] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 최소 검증 (필요 없는 경우 과감히 지워도 됩니다)
    if (!termsService || !termsPrivacy) {
      toast.warning("필수 약관에 동의해 주세요.");
      return;
    }
    if (!email || !password || !passwordConfirm || !name || !phone) {
      toast.warning("모든 필드를 입력해 주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      toast.warning("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const msg = await signup({
        email,
        password,
        name,
        phone,
      });
      toast.success(msg || "인증 메일이 전송되었습니다.");
      navigate("/account/loginchoice", { replace: true });
    } catch (err) {
      console.error("회원 가입 실패:", err);
      toast.error(
        err?.message || "회원 가입에 실패했습니다. 다시 시도해 주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // "전체 약관" 토글 핸들러
  const handleAgreeAllChange = (e) => {
    const checked = e.target.checked;
    setAgreeAll(checked);
    setTermsService(checked);
    setTermsPrivacy(checked);
  };

  // 서비스 약관 토글 핸들러
  const handleServiceChange = (e) => {
    const checked = e.target.checked;
    setTermsService(checked);
    // 둘 다 체크된 경우에만 전체 동의 체크
    setAgreeAll(checked && termsPrivacy);
  };

  // 개인정보 처리 방침 토글 핸들러
  const handlePrivacyChange = (e) => {
    const checked = e.target.checked;
    setTermsPrivacy(checked);
    setAgreeAll(checked && termsService);
  };

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setModalType("");
  };

  return (
    <div className="bg-white border border-gray-200 shadow-sm p-5 w-full max-w-[400px]">
      {/* 타이틀 */}
      <h1 className="text-[40px] font-extrabold pb-2 mb-2">이메일로 가입</h1>

      <form className="space-y-2" onSubmit={handleSubmit}>
        {/* 이메일 */}
        <div>
          <label
            htmlFor="email"
            className="block text-gray-500 text-sm font-bold mb-1 "
          >
            이메일
          </label>
          <input
            id="email"
            type="email"
            placeholder="이메일 주소를 입력해주세요."
            className="w-full px-3 py-2 text-sm placeholder:text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        {/* 비밀번호 */}
        <div>
          <label
            htmlFor="password"
            className="block text-gray-500 text-sm font-bold mb-1"
          >
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            placeholder="특수문자, 숫자, 영문자 조합된 8 이상 문자"
            className="w-full px-3 py-2 text-sm placeholder:text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label
            htmlFor="passwordConfirm"
            className="block text-gray-500 text-sm font-bold mb-1"
          >
            비밀번호 확인
          </label>
          <input
            id="passwordConfirm"
            type="password"
            placeholder="동일한 비밀번호를 다시 입력해주세요."
            className="w-full px-3 py-2 text-sm placeholder:text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {/* 이름 */}
        <div>
          <label
            htmlFor="name"
            className="block text-gray-500 text-sm font-bold mb-1"
          >
            이름
          </label>
          <input
            id="name"
            type="text"
            placeholder="이름을 입력해주세요."
            className="w-full px-3 py-2 text-sm placeholder:text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

        {/* 휴대폰 번호 */}
        <div>
          <label
            htmlFor="phone"
            className="block text-gray-500 text-sm font-bold mb-1"
          >
            휴대폰 번호
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="휴대폰 번호를 입력해주세요."
            className="w-full px-3 py-2 text-sm placeholder:text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
          />
        </div>

        {/* 약관 전체 그룹 */}
        <div className="mt-5 rounded-md ">
          {/* 1) 전체 약관 동의 */}
          <div className="flex rounded-md items-center px-4 py-3 bg-gray-100">
            <input
              id="agreeAll"
              type="checkbox"
              checked={agreeAll}
              onChange={handleAgreeAllChange}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="agreeAll" className="ml-2 text-sm font-medium">
              전체 약관에 동의합니다.
            </label>
          </div>

          {/* 2) 세부 약관 동의 */}
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="termsService"
                  type="checkbox"
                  checked={termsService}
                  onChange={handleServiceChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="termsService" className="ml-2 text-sm">
                  서비스 약관 동의 (필수)
                </label>
              </div>
              <button
                type="button"
                className="text-sm font-extrabold text-gray-500 cursor-pointer hover:underline"
                onClick={() => openModal("service")}
              >
                보기
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="termsPrivacy"
                  type="checkbox"
                  checked={termsPrivacy}
                  onChange={handlePrivacyChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="termsPrivacy" className="ml-2 text-sm">
                  개인정보 처리 방침 및 제3자 제공 동의 (필수)
                </label>
              </div>
              <button
                type="button"
                className="text-sm font-extrabold  text-gray-500 cursor-pointer hover:underline"
                onClick={() => openModal("privacy")}
              >
                보기
              </button>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  id="termsMarketing"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="termsMarketing" className="ml-2 text-sm">
                  광고성 정보 수신 동의 (선택)
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                * 이벤트나 주요 혜택 정보가 있을 때 안내드립니다.
              </p>
            </div>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !termsService ||
              !termsPrivacy ||
              email === "" ||
              name === "" ||
              phone === "" ||
              !password ||
              !passwordConfirm
            }
            className="
            w-full py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition cursor-pointer
            disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "회원가입 요청 중..." : "회원 가입하기"}
          </button>
        </div>
      </form>

      {/* 로그인 링크 */}
      <p className="text-center text-gray-500 mt-4">
        이미 계정이 있으신가요?{" "}
        <Link
          to="/account/loginchoice"
          className="text-blue-600 font-medium hover:underline"
        >
          로그인
        </Link>
      </p>
      <TermsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        modalType={modalType}
      />
    </div>
  );
}
