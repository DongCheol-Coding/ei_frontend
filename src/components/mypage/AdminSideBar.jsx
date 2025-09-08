import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

const linkCls = ({ isActive }) =>
  [
    "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[17px]",
    isActive
      ? "text-indigo-700 font-extrabold"
      : "text-gray-500 hover:bg-gray-50",
  ].join(" ");

export default function AdminSideBar() {
  const user = useSelector((s) => s.auth?.user);
  const name = user?.name ?? "비회원";

  const email = String(user?.email ?? "")
    .trim()
    .toLowerCase();
  const checkInfo = email === "info@dongcheolcoding.life";

  return (
    <aside className="w-full h-full shrink-0 ">
      <div className="bg-white rounded-2xl border border-gray-200 h-full flex flex-col">
        <div className="border-t border-gray-100 divide-y divide-gray-100 flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="px-3 pt-2 pb-1 text-[22px] tracking-wide text-gray-500 font-bold">
              🛠️ 관리자 페이지
            </div>
            <div className="p-2">
              <NavLink to="." end className={linkCls}>
                대시보드
              </NavLink>
              <NavLink to="user" className={linkCls}>
                회원관리
              </NavLink>
              <NavLink to="course" className={linkCls}>
                강의관리
              </NavLink>
              {checkInfo && (
                <NavLink to="chat" className={linkCls}>
                  문의하기
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
