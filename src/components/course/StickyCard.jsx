import { useState } from "react";

export default function StickyCard({
  top = 110, // px 또는 'calc(...)' 등 문자열 가능
  dDay = 5,
  originalPrice = 2590000,
  priceNow = 0,
  refundNote = "*미션 달성 시 수강료 환급",
  mode = "100% 온라인",
  badge = "취준생 전용 20주 과정",
  title = "1:1 관리형\n풀스택 부트캠프",
  ctaText = "취업보장 받기",
  onCtaClick = () => {},
  className = "",
}) {
  const [open, setOpen] = useState(true);
  const priceFmt = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (!open) return null;

  return (
    <aside
      className={[
        "fixed right-6 z-50 hidden lg:block", // 모바일에서는 숨김, 필요 시 조정
        "w-[200px] rounded-xl border border-black/10 bg-white shadow-2xl",
        "overflow-hidden pointer-events-auto", // 클릭 가능
        className,
      ].join(" ")}
      style={{ top: typeof top === "number" ? `${top}px` : top }}
      role="dialog"
      aria-label="고정 알림 카드"
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between p-4">
        <div>
          <div className="text-[12px] text-indigo-600 font-semibold">
            [{badge}]
          </div>
          <div className="mt-1 font-extrabold leading-5">
            {title.split("\n").map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="닫기"
          className="ml-2 -mr-1 rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
        >
          ✕
        </button>
      </div>

      <hr className="border-gray-100" />

      {/* 내용 */}
      <div className="p-4 space-y-3 text-[14px]">
        <div className="text-gray-500">
          마감까지 <span className="font-bold">D-{dDay}</span>
        </div>

        <div className="space-y-1">
          <div className="text-gray-400 line-through">
            {priceFmt(originalPrice)}원
          </div>
          <div className="text-[18px] font-extrabold">
            {priceNow === 0 ? "0원" : `${priceFmt(priceNow)}원`}
            <span className="ml-1 text-[12px] text-gray-500 font-normal">
              {refundNote}
            </span>
          </div>
        </div>

        <div className="pt-1 text-gray-600">
          <div className="text-[12px] text-gray-400 mb-1">교육 방식</div>
          <div className="font-medium">{mode}</div>
        </div>

        <button
          onClick={onCtaClick}
          className="mt-2 w-full rounded-lg bg-indigo-600 py-3 text-white font-bold hover:bg-indigo-700 active:scale-[0.99] transition"
        >
          {ctaText}
        </button>
      </div>
    </aside>
  );
}
