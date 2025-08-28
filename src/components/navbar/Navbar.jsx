import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../services/auth/authSlice";
import { Menu, X } from "lucide-react";
import dc_logo from "../../assets/cd_logo.png";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const isAuth = useSelector((s) => s.auth.isAuthenticated);
  const user = useSelector((s) => s.auth?.user);
  const roles = user?.roles ?? [];
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const admin =
    Array.isArray(roles) &&
    roles
      .map((r) => String(r).toUpperCase().trim())
      .some((r) => r === "ROLE_ADMIN" || r === "ROLE_SUPPORT");

  const handleLogout = async (e) => {
    e?.preventDefault?.();
    const ok = window.confirm("로그아웃하시겠습니까?");
    if (!ok) return;

    try {
      await dispatch(logout()).unwrap();
      toast.success("로그아웃 되었습니다.");
    } catch (err) {
      console.error("logout failed:", err);
      toast.error("로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setOpen(false);
      navigate("/", { replace: true });
    }
  };

  const base = "text-gray-600 px-3 py-2 hover:bg-gray-100 rounded";
  const item = ({ isActive }) =>
    `${base} ${isActive ? "font-extrabold" : "font-medium"}`;

  // 모바일 NavLink 공통 클래스
  const mobileItem = ({ isActive }) =>
    [
      "block px-4 py-3 text-sm text-center",
      isActive
        ? "font-extrabold text-black bg-gray-50"
        : "text-gray-800 hover:bg-gray-50 hover:font-bold",
    ].join(" ");

  const name = useSelector((s) => s.auth?.user?.name) ?? "비회원";

  return (
    <nav className="fixed top-[44px] left-0 w-full bg-white border-b-1 border-gray-200 z-70">
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
          <div className="hidden lg:flex flex-1 gap-3 text-sm xl:text-lg">
            <NavLink to="/course/data" className={item}>
              DATA/AI 부트캠프
            </NavLink>
            <NavLink to="/course/fullstack" className={item}>
              풀스택 부트캠프
            </NavLink>
            <NavLink to="/course/frontend" className={item}>
              프론트엔드 부트캠프
            </NavLink>
            <NavLink to="/course/backend" className={item}>
              백엔드 부트캠프
            </NavLink>
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
                    bg-white border border-gray-200 rounded-lg shadow-lg z-60
                    text-center
                  "
                >
                  {!admin && (
                    <div className="bg-gray-100/80 rounded-none lg:rounded-t-lg lg:rounded-b-none p-2 ">
                      <span className="text-sm">안녕하세요, </span>
                      <span className="text-sm font-bold ">{name}</span>
                      <span className="text-sm"> 님</span>
                    </div>
                  )}
                  <Link
                    to={admin ? "admin" : "mypage"}
                    className={[
                      "block px-4 py-2 text-sm hover:bg-gray-50 hover:font-bold",
                      admin ? "text-red-500" : "text-gray-800",
                    ].join(" ")}
                  >
                    {admin ? "관리자페이지" : "마이페이지"}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full block px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 hover:font-bold cursor-pointer "
                  >
                    로그아웃
                  </button>
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
            {/* 바깥 클릭 닫힘용 오버레이 (패널보다 '아래'에 배치) */}
            <div
              className="fixed inset-0 lg:hidden z-40"
              onClick={() => setOpen(false)}
            />
            {/* 패널 (오버레이보다 z-index가 높아야 클릭 가능) */}
            <div
              className="lg:hidden absolute right-0 top-full w-[200px] bg-white border border-gray-200 rounded-md shadow-xl z-[80]"
              role="menu"
              aria-label="모바일 내비게이션"
            >
              <nav className="py-2 text-center">
                <NavLink
                  to="/course/data"
                  className={mobileItem}
                  onClick={() => setOpen(false)}
                >
                  DATA/AI 부트캠프
                </NavLink>
                <NavLink
                  to="/course/fullstack"
                  className={mobileItem}
                  onClick={() => setOpen(false)}
                >
                  풀스택 부트캠프
                </NavLink>
                <NavLink
                  to="/course/frontend"
                  className={mobileItem}
                  onClick={() => setOpen(false)}
                >
                  프론트엔드 부트캠프
                </NavLink>
                <NavLink
                  to="/course/backend"
                  className={mobileItem}
                  onClick={() => setOpen(false)}
                >
                  백엔드 부트캠프
                </NavLink>
              </nav>

              <div className="border-t border-t-gray-300" />

              <div className="py-2 text-center">
                {isAuth ? (
                  <>
                    <NavLink
                      to={admin ? "admin" : "mypage"}
                      className={({ isActive }) =>
                        [
                          "block px-4 py-3 text-[15px] font-bold",
                          admin ? "text-red-500" : "text-gray-800",
                          isActive ? "bg-violet-50" : "hover:bg-violet-50",
                        ].join(" ")
                      }
                      onClick={() => setOpen(false)}
                    >
                      {admin ? "관리자페이지" : "마이페이지"}
                    </NavLink>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full block px-4 py-3 text-sm font-semibold text-gray-400 hover:bg-violet-50"
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink
                      to="account/loginchoice"
                      className={({ isActive }) =>
                        [
                          "block px-4 py-3 text-sm font-semibold",
                          isActive
                            ? "bg-violet-50 text-violet-700"
                            : "text-violet-600 hover:bg-violet-50",
                        ].join(" ")
                      }
                      onClick={() => setOpen(false)}
                    >
                      로그인
                    </NavLink>
                    <NavLink
                      to="account/signupchoice"
                      className={({ isActive }) =>
                        [
                          "block px-4 py-3 text-sm font-semibold",
                          isActive
                            ? "bg-violet-50 text-violet-700"
                            : "text-violet-600 hover:bg-violet-50",
                        ].join(" ")
                      }
                      onClick={() => setOpen(false)}
                    >
                      회원가입
                    </NavLink>
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
