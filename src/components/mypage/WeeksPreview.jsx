// src/components/WeeksPreview.jsx
import React, { useMemo, useRef, useEffect } from "react";

// ===== 유틸 함수들 (함께 정의 필요) =====
const parseLocalDateTime = (s) => {
  if (!s || typeof s !== "string") return null;
  const m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!m) return new Date(s);
  const [, yy, mm, dd, HH, MM, SS = "0"] = m;
  return new Date(+yy, +mm - 1, +dd, +HH, +MM, +SS);
};

const stripTime = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const startOfWeekMon = (d) => {
  const x = stripTime(d);
  const dow = x.getDay(); // 0=일~6=토
  const diff = (dow + 6) % 7; // 월요일까지 되돌림
  x.setDate(x.getDate() - diff);
  return x;
};

// ===== WeeksPreview 컴포넌트 =====
export default function WeeksPreview({ paymentDateStr, attendedDates = [] }) {
  const scrollRef = useRef(null);
  const weekRefs = useRef([]);

  if (!paymentDateStr) return null;

  const pay = parseLocalDateTime(paymentDateStr);
  if (!pay || Number.isNaN(pay.getTime())) return null;

  const today = stripTime(new Date());
  const attendedSet = useMemo(
    () =>
      new Set((Array.isArray(attendedDates) ? attendedDates : []).map(String)),
    [attendedDates]
  );
  const toKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const payD0 = stripTime(pay);
  const week1Mon = startOfWeekMon(payD0);
  const week1Sun = addDays(week1Mon, 6);

  const week1Days = [];
  for (let d = new Date(payD0); d <= week1Sun; d = addDays(d, 1)) {
    week1Days.push(new Date(d));
  }

  const TOTAL_WEEKS = 8;
  const weeks = [{ label: "1주차", days: week1Days }];
  let nextMon = addDays(week1Sun, 1);
  for (let w = 2; w <= TOTAL_WEEKS; w++) {
    const days = [];
    for (let i = 0; i < 7; i++) days.push(addDays(nextMon, i));
    weeks.push({ label: `${w}주차`, days });
    nextMon = addDays(nextMon, 7);
  }

  const weekIndexOfToday = useMemo(() => {
    return weeks.findIndex((wk) =>
      wk.days.some((d) => stripTime(d).getTime() === today.getTime())
    );
  }, [weeks, today]);

  const DayDot = ({ d }) => {
    const isToday = stripTime(d).getTime() === today.getTime();
    const isAttended = attendedSet.has(toKey(d));

    let base =
      "relative grid place-items-center rounded-full select-none text-[13px] font-semibold w-8 h-8 transition-transform";
    let colors = isAttended
      ? "bg-blue-500 text-white"
      : "bg-gray-300 text-gray-700";
    let todayFx = isToday
      ? "scale-110 ring-2 ring-rose-400 ring-offset-2 ring-offset-gray-100"
      : "";

    if (isToday && isAttended) colors = "bg-blue-600 text-white";

    return (
      <div className={`${base} ${colors} ${todayFx}`} title={toKey(d)}>
        {d.getDate()}
      </div>
    );
  };

  // 오늘 주차로 스크롤
  useEffect(() => {
    const container = scrollRef.current;
    const target = weekRefs.current?.[weekIndexOfToday];
    if (!container || !target || weekIndexOfToday < 0) return;

    const raf = requestAnimationFrame(() => {
      const cRect = container.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      const left = tRect.left - cRect.left + container.scrollLeft - 12;
      container.scrollTo({ left, behavior: "auto" });
    });
    return () => cancelAnimationFrame(raf);
  }, [weekIndexOfToday]);

  return (
    <div className="mt-2 min-w-0 max-w-full">
      <div ref={scrollRef} className="min-w-0 max-w-full overflow-x-auto pb-1">
        <div className="flex gap-4 min-w-max items-start">
          {weeks.map((wk, i) => (
            <div
              key={wk.label}
              ref={(el) => (weekRefs.current[i] = el)}
              className="shrink-0"
            >
              <div className="text-[11px] text-gray-400 mb-1">{wk.label}</div>
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-3 rounded-xl">
                {wk.days.map((d) => (
                  <DayDot key={d.toISOString()} d={d} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
