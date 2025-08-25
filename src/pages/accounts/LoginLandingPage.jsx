// src/pages/LoginLandingPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import kakaoIcon from "../../assets/icon-kakao.svg";

const BASE_URL = import.meta.env.VITE_API_SERVER_HOST;

export default function LoginLandingPage() {
  const navigate = useNavigate();

  const [kakaoLocked, setKakaoLocked] = useState(false);
  const redirectTimerRef = useRef(null);

  // [변경] 카카오 로그인: 더블클릭/중복요청 방지 + 예약 리다이렉트(취소 가능)
  const handleKakaoLogin = () => {
    if (kakaoLocked) return;
    setKakaoLocked(true);

    // 아주 짧은 지연 뒤 리다이렉트 -> 그 사이에 다른 이동을 누르면 아래에서 취소 가능
    redirectTimerRef.current = window.setTimeout(() => {
      // replace: 뒤로가기 히스토리 정리(선호에 따라 assign 사용 가능)
      window.location.replace(`${BASE_URL}/oauth2/authorization/kakao`);
    }, 80);
  };

  // [추가] 진행 중에 다른 페이지로 이동하려 할 때 확인 후 리다이렉트 예약 취소
  const guardedNavigate = (to) => {
    if (kakaoLocked) {
      const ok = window.confirm(
        "카카오 로그인 진행 중입니다. 취소하고 이동할까요?"
      );
      if (!ok) return;
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
      setKakaoLocked(false);
    }
    navigate(to);
  };

  // [추가] 언마운트 시 예약된 리다이렉트 정리(요청 취소 효과)
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative bg-[#edfdeb] border border-gray-200 shadow-sm p-5 w-full max-w-[400px] rounded">
      {/* 타이틀 */}
      <h1 className="text-[40px] font-extrabold pb-2 mb-6">로그인</h1>

      {/* 카카오 버튼 */}
      <button
        type="button"
        onClick={handleKakaoLogin}
        disabled={kakaoLocked}
        aria-disabled={kakaoLocked}
        className="w-full text-[18px] font-bold flex items-center justify-center mb-4 py-3 rounded-lg bg-[#fae100] hover:bg-yellow-300 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <img src={kakaoIcon} alt="카카오 아이콘" />
        <span className="mx-10">카카오로 1초만에 시작하기</span>
      </button>

      {/* 이메일 로그인 */}
      <button
        type="button"
        className="w-full text-[18px] text-gray-500 font-bold mb-4 py-3 border border-gray-300 rounded-lg hover:bg-[#e3fee1] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={kakaoLocked}
        aria-disabled={kakaoLocked}
        onClick={() => guardedNavigate("/account/elogin")}
      >
        이메일로 로그인
      </button>

      {/* 회원가입 링크 */}
      <button
        type="button"
        className="w-full text-[18px] text-gray-500 font-bold mt-8 py-3 border border-gray-300 rounded-lg hover:bg-[#e3fee1] transition flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={kakaoLocked}
        aria-disabled={kakaoLocked}
        onClick={() => guardedNavigate("/account/signupchoice")}
      >
        아직 계정이 없으신가요?
        <span className="text-blue-600 ml-1">회원가입</span>
      </button>

      {/* [추가] 진행 중 오버레이(클릭 차단 + 취소 버튼 제공) */}
      {kakaoLocked && (
        <div className="absolute inset-0 rounded bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
          <div className="px-4 py-2 text-sm text-gray-700 bg-white border rounded shadow">
            카카오 로그인으로 이동 중...
            <button
              type="button"
              className="ml-3 underline font-medium"
              onClick={() => {
                if (redirectTimerRef.current) {
                  clearTimeout(redirectTimerRef.current);
                  redirectTimerRef.current = null;
                }
                setKakaoLocked(false);
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
