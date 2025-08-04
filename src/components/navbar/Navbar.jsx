// src/components/navbar/Navbar.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="w-full bg-transparent relative z-50">
      <div className="max-w-8xl mx-auto px-10">
        <div className="flex items-center justify-between h-[54px]">
          {/* 로고 */}
          <div className="flex-shrink-0">
            <Link to="/">
              <span className="font-bold text-xl">DONGCHEOL CODING</span>
            </Link>
          </div>

          {/* 데스크탑 메뉴 */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/course/data"
              className="text-sm font-lg px-3 py-2 hover:bg-gray-100 rounded"
            >
              DATA/AI 부트캠프
            </Link>
            <Link
              to="/course/fullstack"
              className="text-sm font-lg px-3 py-2 hover:bg-gray-100 rounded"
            >
              풀스택 부트캠프
            </Link>
            <Link
              to="/course/frontend"
              className="text-sm font-lg px-3 py-2 hover:bg-gray-100 rounded"
            >
              프론트엔드 부트캠프
            </Link>
            <Link
              to="/course/backend"
              className="text-sm font-lg px-3 py-2 hover:bg-gray-100 rounded"
            >
              백엔드 부트캠프
            </Link>
          </div>

          {/* 오른쪽 버튼/링크 */}
          <div className="hidden md:flex items-center space-x-3">
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
