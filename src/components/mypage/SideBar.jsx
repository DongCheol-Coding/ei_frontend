import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import UserImage from "./userImage";
import noImage from "../../assets/mypage/noimage.png";


const linkCls = ({ isActive }) =>
  [
    "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[17px]",
    isActive
      ? "text-indigo-700 font-extrabold"
      : "text-gray-500 hover:bg-gray-50",
  ].join(" ");

export default function SideBar() {
  const user = useSelector((s) => s.auth?.user);
  const name = user?.name ?? "비회원";
  const imageUrl = user?.imageUrl ?? "";
  const roles = user?.roles ?? [];

  const admin =
    Array.isArray(roles) &&
    roles
      .map((r) => String(r).toUpperCase().trim())
      .some((r) => r === "ROLE_ADMIN" || r === "ROLE_SUPPORT");

  return (
    <aside className="w-full h-full shrink-0 ">
      <div className="bg-white rounded-2xl border border-gray-200 h-full flex flex-col">
        <div className="px-6 py-8 text-center">
         <UserImage
         imageUrl={imageUrl}
         noImage={noImage} />

          <div className="mt-1 ">
            <span className="text-[24px] font-extrabold">{name}</span>
            <span className="font-bold"> 님,</span>
          </div>
          <div className="text-s text-gray-500 font-bold">반가워요!</div>
        </div>
        <div className="border-t border-gray-100 divide-y divide-gray-100 flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="px-3 pt-2 pb-1 text-[22px] tracking-wide text-gray-500 font-bold">
              👤 마이페이지
            </div>
            <div className="p-2">
              <NavLink to="." end className={linkCls}>
                대시보드
              </NavLink>
              <NavLink to="profile" className={linkCls}>
                프로필
              </NavLink>
              <NavLink to="paymentshistory" className={linkCls}>
                결제 내역
              </NavLink>
            </div>
          </div>
          <div className="p-2">
            <div className="px-3 pt-2 pb-1 text-[22px] tracking-wide text-gray-500 font-bold">
              🎧 내 강의실
            </div>
            <div className="p-2">
              <NavLink to="ingcourse" className={linkCls}>
                수강중인 강의
              </NavLink>
              <NavLink to="endcourse" className={linkCls}>
                수강완료 강의
              </NavLink>
            </div>
          </div>
          {admin && (
            <div className="p-2">
              <Link
                to="/admin"
                className="block px-3 pt-2 pb-1 text-[22px] tracking-wide font-bold text-red-500 hover:bg-gray-50 cursor-pointer"
              >
                🛠️ 관리자 페이지
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
