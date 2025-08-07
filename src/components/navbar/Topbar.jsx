import React from "react";

export default function TopBar({ message }) {
  return (
    <div className="fixed top-0 left-0 w-full h-[44px] bg-[#4f3cff] text-white font-extrabold flex justify-center z-50">
      <div className="container max-w-7xl px-10 flex justify-center items-center">
        부트캠프 최초 국내외 기업 협업 프로젝트 진행! 차별화된
        이력서로🔥100%취업!🔥
      </div>
    </div>
  );
}
