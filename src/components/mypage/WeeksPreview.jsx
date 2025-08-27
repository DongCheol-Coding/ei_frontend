// src/components/WeeksPreview.jsx
/*
[변경 요약]
- 총 56일(8×7) 고정 범위를 payDate 포함으로 생성: [payDate, payDate+55]
- 위 범위를 월~일(월요일 시작) 주차로 분할하되, 범위 밖 날짜는 미생성
  → 예) 결제일이 일요일이면 1주차=1개, 마지막 주차=6개, 합계 정확히 56개
- '다음(>)'은 트랙 끝에서 자동 비활성화(스크롤 끝 판정 기반)
*/

import React, {
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
} from "react";

// --- 유틸 ---
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
  const dow = x.getDay(); // 0=Sun .. 6=Sat
  const diff = (dow + 6) % 7; // 월요일 기준
  x.setDate(x.getDate() - diff);
  return x;
};

// --- 컴포넌트 ---
export default function WeeksPreview({
  paymentDateStr,
  attendedDates = [],
  totalWeeks = 8, // 총 주차(개수) → 총일수 = totalWeeks*7
}) {
  if (!paymentDateStr) return null;
  const pay = parseLocalDateTime(paymentDateStr);
  if (!pay || Number.isNaN(pay.getTime())) return null;

  const payDate = stripTime(pay);
  const today = stripTime(new Date());

  const TOTAL_DAYS = (totalWeeks || 8) * 7; // 기본 56일
  const rangeStart = payDate;
  const rangeEnd = addDays(payDate, TOTAL_DAYS - 1);

  const attendedSet = useMemo(
    () =>
      new Set((Array.isArray(attendedDates) ? attendedDates : []).map(String)),
    [attendedDates]
  );
  const toKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  // 분할 기준: 결제일이 속한 "그 주의 월요일"
  const week1Mon = startOfWeekMon(rangeStart);

  // [payDate ~ payDate+55] 범위를 월~일 주차로 분할(범위 밖은 미생성)
  const weeks = useMemo(() => {
    const out = [];
    let start = new Date(week1Mon);
    while (start.getTime() <= rangeEnd.getTime()) {
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));
      const within = weekDays.filter(
        (d) =>
          stripTime(d).getTime() >= rangeStart.getTime() &&
          stripTime(d).getTime() <= rangeEnd.getTime()
      );
      out.push({ label: `${out.length + 1}주차`, days: within });
      start = addDays(start, 7);
    }
    return out;
  }, [week1Mon, rangeStart, rangeEnd]);

  // 초기 페이지: 오늘이 포함된 주(없으면 0)
  const weekIndexOfToday = useMemo(() => {
    const idx = weeks.findIndex((wk) =>
      wk.days.some((d) => stripTime(d).getTime() === today.getTime())
    );
    return idx >= 0 ? idx : 0;
  }, [weeks, today]);

  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const weekRefs = useRef([]);

  const [page, setPage] = useState(0); // 왼쪽에 둘 주차 인덱스
  const [offset, setOffset] = useState(0); // px 이동량
  const [canNext, setCanNext] = useState(true); // 오른쪽 버튼 활성화 여부

  // page 기준으로 오프셋 재계산 + 끝 도달 판정
  const recalcOffsetFor = (idx) => {
    const container = containerRef.current;
    const track = trackRef.current;
    const el = weekRefs.current?.[idx];
    if (!container || !track || !el) return;

    const maxOffset = Math.max(0, track.scrollWidth - container.clientWidth);
    const desired = el.offsetLeft; // 해당 주차의 좌측
    const next = Math.min(Math.max(0, desired), maxOffset);

    setOffset(next);
    setCanNext(next < maxOffset - 1); // EPS=1
  };

  useEffect(() => {
    setPage(weekIndexOfToday);
  }, [weekIndexOfToday]);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => recalcOffsetFor(page));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, weeks.length]);

  useEffect(() => {
    const onResize = () => requestAnimationFrame(() => recalcOffsetFor(page));
    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(onResize);
      containerRef.current && ro.observe(containerRef.current);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, weeks.length]);

  const canPrev = page > 0;

  const goNext = () => {
    if (!canNext) return;
    const target = Math.min(page + 1, weeks.length - 1);
    setPage(target);
  };
  const goPrev = () => {
    if (!canPrev) return;
    setPage(page - 1);
  };

  const DayDot = ({ d }) => {
    const isToday = stripTime(d).getTime() === today.getTime();
    const isAttended = attendedSet.has(toKey(d));
    const base =
      "relative grid place-items-center rounded-full select-none text-[13px] font-semibold w-8 h-8 transition-transform";
    const colors = isAttended
      ? "bg-blue-500 text-white"
      : "bg-gray-300 text-gray-700";
    const fx = isToday
      ? "scale-110 ring-2 ring-rose-400 ring-offset-2 ring-offset-gray-100"
      : "";
    return (
      <div className={`${base} ${colors} ${fx}`} title={toKey(d)}>
        {d.getDate()}
      </div>
    );
  };

  return (
    <div className="mt-2 min-w-0 max-w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-gray-700">출결 현황</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-8 h-8 grid place-content-center rounded border hover:bg-gray-50 disabled:opacity-40"
            onClick={goPrev}
            disabled={!canPrev}
            aria-label="이전 주"
          >
            ‹
          </button>
          <button
            type="button"
            className="w-8 h-8 grid place-content-center rounded border hover:bg-gray-50 disabled:opacity-40"
            onClick={goNext}
            disabled={!canNext}
            aria-label="다음 주(끝에서는 비활성화)"
          >
            ›
          </button>
        </div>
      </div>

      <div ref={containerRef} className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex items-start gap-4 transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${offset}px)` }}
        >
          {weeks.map((wk, i) => (
            <div
              key={wk.label}
              ref={(el) => (weekRefs.current[i] = el)}
              className="shrink-0"
            >
              <div className="text-[11px] text-gray-400 mb-2">{wk.label}</div>
              <div className="h-12 flex items-center gap-2 bg-gray-100 px-3 rounded-xl">
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
