// src/components/navbar/Navbar.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../services/auth/authSlice";
import { Menu, X } from "lucide-react";
import dc_logo from "../../assets/cd_logo.png";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const isAuth = useSelector((s) => s.auth.isAuthenticated);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    setOpen(false);
    navigate("/", { replace: true });
  };

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

          {/* 강의 메뉴 */}
          <div className="hidden lg:flex flex-1 gap-3">
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
          <div className="hidden lg:flex items-center space-x-3 gap-3 flex-none">
            {isAuth ? (
              <div className="relative group">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-lg font-bold bg-white text-black hover:bg-gray-50"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  MY
                  <svg
                    className="ml-1 h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* 드롭다운 메뉴 */}
                <div
                  className="
                    invisible opacity-0 translate-y-1
                    group-hover:visible group-hover:opacity-100 group-hover:translate-y-0
                    group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0
                    transition duration-150
                    absolute right-0 top-full mt-2 w-44
                    bg-white border border-gray-200 rounded-lg shadow-lg z-50
                    py-2
                  "
                >
                  <Link
                    to="mypage"
                    className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                  >
                    마이페이지
                  </Link>
                  <Link
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                  >
                    로그아웃
                  </Link>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* 모바일 햄버거 */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="menu"
              aria-expanded={open}
              className="p-2"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {/* --- 모바일 드롭다운 패널(오른쪽 정렬) --- */}
        {open && (
          <>
            {/* 바깥 클릭 닫힘용 오버레이 */}
            <div
              className="fixed inset-0 lg:hidden z-40"
              onClick={() => setOpen(false)}
            />
            {/* 패널 */}
            <div className="lg:hidden absolute right-0 top-full w-[200px] bg-white border border-gray-200 rounded-md shadow-xl z-50">
              <nav className="py-2 text-center">
                <Link
                  to="/course/data"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-sm text-gray-800 hover:bg-gray-50"
                >
                  DATA/AI 부트캠프
                </Link>
                <Link
                  to="/course/fullstack"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-sm text-gray-800 hover:bg-gray-50"
                >
                  풀스택 부트캠프
                </Link>
                <Link
                  to="/course/frontend"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-sm text-gray-800 hover:bg-gray-50"
                >
                  프론트엔드 부트캠프
                </Link>
                <Link
                  to="/course/backend"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-sm text-gray-800 hover:bg-gray-50"
                >
                  백엔드 부트캠프
                </Link>
              </nav>

              <div className="border-t border-t-gray-300" />

              <div className="py-2 text-center">
                {isAuth ? (
                  <>
                    <div>
                      <Link
                        to="mypage"
                        className="block px-4 py-3 text-[15px] font-bold hover:bg-violet-50"
                      >
                        마이페이지
                      </Link>
                    </div>
                    <Link
                      onClick={handleLogout}
                      className="block px-4 py-3 text-sm font-semibold text-gray-400 hover:bg-violet-50"
                    >
                      로그아웃
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="account/loginchoice"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 text-sm font-semibold text-violet-600 hover:bg-violet-50"
                    >
                      로그인
                    </Link>
                    <Link
                      to="account/signupchoice"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 text-sm font-semibold text-violet-600 hover:bg-violet-50"
                    >
                      회원가입
                    </Link>
                  </>
                )}
              </div>
            </div>
          </>
        )}
        {/* --- /모바일 드롭다운 패널 --- */}
      </div>
    </nav>
  );
}
