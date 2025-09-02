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

// YYYY-MM-DD로 정규화
const toYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
// 문자열 → YYYY-MM-DD 정규화("2025-09-02", "2025-09-02T..." 모두 수용)
const normalizeToYMD = (s) => {
  if (typeof s !== "string") return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const t = Date.parse(s);
  if (Number.isFinite(t)) return toYMD(new Date(t));
  return null;
};

// --- 컴포넌트 ---
export default function WeeksPreview({
  paymentDateStr,
  // 아래 세 개 중 아무 이름으로 내려줘도 됨
  highlightDates = [],
  attendedDates = [],
  attendanceDates = [],
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

  // 출석일: 모든 입력 배열 병합 → YYYY-MM-DD 정규화 → Set
  const attendedSet = useMemo(() => {
    const all = []
      .concat(Array.isArray(highlightDates) ? highlightDates : [])
      .concat(Array.isArray(attendedDates) ? attendedDates : [])
      .concat(Array.isArray(attendanceDates) ? attendanceDates : [])
      .map(normalizeToYMD)
      .filter(Boolean);
    return new Set(all);
  }, [highlightDates, attendedDates, attendanceDates]);

  const toKey = (d) => toYMD(d);

  // 결제일이 속한 "그 주의 월요일"부터 주차 분할
  const week1Mon = startOfWeekMon(rangeStart);

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
      ? "bg-indigo-700 text-white border border-indigo-700"
      : "bg-white text-gray-700 border border-gray-300";
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
                  <DayDot key={toKey(d)} d={d} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
