import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function EmailLoginPage() {
  return (
    <div className="flex items-center justify-center p-20">
      <div className="bg-white border border-gray-200 shadow-sm p-5 w-full max-w-[400px]">
        {/* 타이틀 */}
        <h1 className="text-[40px] font-extrabold pb-2 mb-2">
          이메일로 로그인
        </h1>

        <form className="space-y-2">
          {/* 이메일 */}
          <div>
            <label
              htmlFor="email"
              className="block text-gray-500 text-sm font-bold mb-1"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              placeholder="이메일 주소를 입력해주세요."
              className="w-full px-3 py-2 text-sm placeholder:text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            />
          </div>

          {/* 제출 버튼 */}
          <div>
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-[#0047ff] transition mt-8"
            >
              로그인
            </button>
          </div>
        </form>

        {/* 아이디 비밀번호 찾기 링크 */}
        <p className="text-center text-sm text-gray-500 mt-4">
          아이디 또는 비밀번호를 잊으셨나요?{" "}
          <Link to="" className="text-blue-600  font-medium hover:underline">
            <span>아이디</span> <span>비밀번호</span> <span>찾기</span>
          </Link>
        </p>

        {/* 회원가입 링크 */}
        <p className="text-center font-extrabold text-gray-500 mt-4">
          아직 계정이 없으신가요?{" "}
          <Link
            to="/account/signupchoice"
            className="text-blue-600 font-extrabold hover:underline"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
