// src/components/navbar/Navbar.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import dc_logo from "../../assets/cd_logo.png";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-[44px] left-0 w-full bg-white border-b-1 border-gray-200 z-40">
      <div className="container max-w-8xl mx-auto px-10">
        <div className="flex items-center justify-between h-[54px]">
          {/* 로고 */}
          <div className="flex-shrink-0 flex items-center space-x-2">
            <Link to="/">
              <img
                src={dc_logo}
                alt="동철코딩 로고"
                className="h-5 w-auto"
                loading="lazy"
              />
            </Link>
            <div className="flex flex-col mx-4">
              <span className="text-xs font-bold text-blue-700">
                부트캠프 압도적
              </span>
              <span className="text-xs font-bold text-blue-700">
                1위의 책임감*
              </span>
            </div>
          </div>

          {/* 데스크탑 메뉴 */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/course/data"
              className="text-lg font-medium text-gray-600 text-gray-600px-3 py-2 hover:bg-gray-100 rounded"
            >
              DATA/AI 부트캠프
            </Link>
            <Link
              to="/course/fullstack"
              className="text-lg font-medium text-gray-600 px-3 py-2 hover:bg-gray-100 rounded"
            >
              풀스택 부트캠프
            </Link>
            <Link
              to="/course/frontend"
              className="text-lg font-medium text-gray-600 px-3 py-2 hover:bg-gray-100 rounded"
            >
              프론트엔드 부트캠프
            </Link>
            <Link
              to="/course/backend"
              className="text-lg font-medium text-gray-600 px-3 py-2 hover:bg-gray-100 rounded"
            >
              백엔드 부트캠프
            </Link>
          </div>

          {/* 오른쪽 버튼/링크 */}
          <div className="hidden md:flex items-center space-x-3 ml-60">
            <Link
              to="account/loginchoice"
              className="inline-block px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium bg-white text-black"
            >
              로그인
            </Link>
            <Link
              to="account/signupchoice"
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-black text-white hover:opacity-90"
            >
              회원가입
            </Link>
          </div>

          {/* 모바일 햄버거 */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="menu"
              className="p-2"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
