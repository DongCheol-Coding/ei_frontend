import React from "react";
import { useNavigate } from "react-router-dom";
import kakaoIcon from "../../assets/icon-kakao.svg";

const KAKAO_OAUTH_URL = import.meta.env.VITE_KAKAO_OAUTH;

export default function LoginLandingPage() {
  const navigate = useNavigate();

  const handleKakaoLogin = () => {
    const url = `${KAKAO_OAUTH_URL}/authorization/kakao`;
    window.location.href = url;
  };

  return (
    <div className="bg-[#fefee1] border border-gray-200 shadow-sm p-5 w-full max-w-[400px]">
      {/* 타이틀 */}
      <h1 className="text-[40px] font-extrabold pb-2 mb-6">회원가입</h1>

      {/* 카카오 버튼 */}
      <button
        type="button"
        onClick={() => handleKakaoLogin()}
        className="w-full text-[18px] font-bold flex items-center justify-center mb-4 py-3 rounded-lg bg-[#fae100] hover:bg-yellow-300 transition cursor-pointer"
      >
        <img src={kakaoIcon} alt="카카오 아이콘" />
        <span className="mx-10">카카오로 1초만에 시작하기</span>
      </button>

      {/* 이메일 회원가입 */}
      <button
        type="button"
        className="w-full text-[18px] text-gray-500 font-bold mb-4 py-3 border border-gray-300 rounded-lg hover:bg-[#fcfcce] transition cursor-pointer"
        onClick={() => navigate("/account/esignup")}
      >
        이메일로 가입
      </button>

      {/* 로그인 링크 */}
      <button
        type="button"
        className="w-full text-[18px] text-gray-500 font-bold mt-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center cursor-pointer"
        onClick={() => navigate("/account/loginchoice")}
      >
        이미 계정이 있으신가요?
        <span className="text-blue-600 ml-1">로그인</span>
      </button>
    </div>
  );
}
