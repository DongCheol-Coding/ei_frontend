import React from "react";
import { NavLink } from "react-router-dom";

const linkCls = ({ isActive }) =>
  [
    "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[17px]",
    isActive
      ? "text-indigo-700 font-extrabold"
      : "text-gray-500 hover:bg-gray-50",
  ].join(" ");

export default function SideBar() {
  return (
    <aside className="w-full h-full shrink-0 ">
      <div className="bg-white rounded-2xl border border-gray-200 h-full flex flex-col">
        <div className="px-6 py-8 text-center">
          <div className="mx-auto mb-4 h-[120px] w-[120px] rounded-full grid place-items-center bg-gray-100 text-gray-500 text-2xl">
            img
          </div>
          <div className="mt-1 ">
            <span className="text-[24px] font-extrabold">[FE]PART.이동현</span>
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
        </div>
      </div>
    </aside>
  );
}
