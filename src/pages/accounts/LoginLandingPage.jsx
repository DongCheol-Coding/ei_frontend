import React from "react";
import { useNavigate } from "react-router-dom";
import kakaoIcon from "../../assets/icon-kakao.svg";

export default function LoginLandingPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#edfdeb] border border-gray-200 shadow-sm p-5 w-full max-w-[400px]">
      {/* 타이틀 */}
      <h1 className="text-[40px] font-extrabold pb-2 mb-6">로그인</h1>

      {/* 카카오 버튼 */}
      <button
        type="button"
        className="w-full text-[18px] font-bold flex items-center justify-center mb-4 py-3 rounded-lg bg-[#fae100] hover:bg-yellow-300 transition cursor-pointer"
      >
        <img src={kakaoIcon} alt="카카오 아이콘" />
        <span className="mx-10">카카오로 1초만에 시작하기</span>
      </button>

      {/* 이메일 로그인 */}
      <button
        type="button"
        className="w-full text-[18px] text-gray-500 font-bold mb-4 py-3 border border-gray-300 rounded-lg hover:bg-[#e3fee1] transition cursor-pointer"
        onClick={() => navigate("/account/elogin")}
      >
        이메일로 로그인
      </button>

      {/* 회원가입 링크 */}
      <button
        type="button"
        className="w-full text-[18px] text-gray-500 font-bold mt-8 py-3 border border-gray-300 rounded-lg hover:bg-[#e3fee1] transition flex items-center justify-center cursor-pointer"
        onClick={() => navigate("/account/signupchoice")}
      >
        아직 계정이 없으신가요?
        <span className="text-blue-600 ml-1">회원가입</span>
      </button>

      {/* 비회원 상담 */}
      {/* <button
          type="button"
          className="w-full text-[18px] text-gray-500 font-bold py-3 border border-gray-300 rounded-lg hover:bg-[#e3fee1] transition cursor-pointer"
        >
          비회원으로 상담받기
        </button> */}
    </div>
  );
}
