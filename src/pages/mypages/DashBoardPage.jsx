// src/pages/MyPageLandingPage.jsx
/*
[수정됨]
- 진행률 계산을 progressPercent(신규 스키마) 기반으로 변경(0~100 clamp, 소수 1자리 표시)
- navigate 시 totalLectures, completedLectures를 state로 전달
- Fragment에 key 부여로 React key 경고 방지
*/

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useOutletContext, useNavigate } from "react-router-dom";
import { getMyCourses } from "../../services/api/myPageApi";

const FALLBACK_IMG = "https://placehold.co/300x200";

export default function MyPageLandingPage() {
  const { latestPaidCourseId, payments = [] } = useOutletContext() ?? {};
  const accessToken = useSelector((s) => s.auth?.accessToken) ?? null;
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const acRef = useRef(null);

  const [selected, setSelected] = useState("");

  useEffect(() => {
    acRef.current?.abort?.();
    const ac = new AbortController();
    acRef.current = ac;

    setLoading(true);
    setErr(null);
    getMyCourses({ accessToken, signal: ac.signal })
      .then((list) => setRows(Array.isArray(list) ? list : []))
      .catch((e) => setErr(e?.message || "내 코스를 불러오지 못했습니다."))
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [accessToken]);

  const clampPercent = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.min(100, Math.max(0, n));
  };
  const fmtPercent = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

  // progressPercent 우선 사용(없으면 구버전 progress*100 추정)
  const viewRows = useMemo(
    () =>
      (rows ?? []).map((c) => {
        const rawPct =
          c?.progressPercent ??
          (c?.progress != null ? Number(c.progress) * 100 : 0);
        const __percent = clampPercent(rawPct);
        return { ...c, __percent, __percentText: fmtPercent(__percent) };
      }),
    [rows]
  );

  // 코스별 최신 결제 찾기
  const paymentByCourse = useMemo(() => {
    const map = new Map();
    for (const p of Array.isArray(payments) ? payments : []) {
      const cid = Number(p?.courseId);
      if (!Number.isFinite(cid)) continue;
      const prev = map.get(cid);
      if (!prev) {
        map.set(cid, p);
      } else {
        const dNew = new Date(p?.paymentDate ?? 0).getTime();
        const dOld = new Date(prev?.paymentDate ?? 0).getTime();
        if (dNew > dOld) map.set(cid, p);
      }
    }
    return map;
  }, [payments]);

  // 드롭박스 옵션(중복 제거) + 정렬
  const options = useMemo(() => {
    const titleById = new Map();
    for (const c of viewRows) {
      const id = Number(c?.courseId);
      if (!Number.isFinite(id)) continue;
      if (!titleById.has(id)) titleById.set(id, c?.courseTitle || "제목 없음");
    }
    const idsAsc = Array.from(titleById.keys()).sort((a, b) => a - b);
    const ordered = [];
    if (
      latestPaidCourseId != null &&
      titleById.has(Number(latestPaidCourseId))
    ) {
      ordered.push(Number(latestPaidCourseId));
    }
    for (const id of idsAsc) {
      if (id !== Number(latestPaidCourseId)) ordered.push(id);
    }
    return ordered.map((id) => ({
      value: String(id),
      label: titleById.get(id),
    }));
  }, [viewRows, latestPaidCourseId]);

  // 초기 선택값 설정/보정
  useEffect(() => {
    if (!options.length) return;
    if (!options.some((op) => op.value === selected)) {
      setSelected(options[0].value);
    }
  }, [options, selected]);

  const filtered = useMemo(() => {
    const id = Number(selected);
    if (!Number.isFinite(id)) return [];
    return viewRows.filter((c) => Number(c?.courseId) === id);
  }, [selected, viewRows]);

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
    const dow = x.getDay(); // 0=일..6=토
    const diff = (dow + 6) % 7; // 월요일까지 며칠 되돌릴지
    x.setDate(x.getDate() - diff);
    return x;
  };

  function WeeksPreview({ paymentDateStr, attendedDates = [] }) {
    if (!paymentDateStr) return null;
    const pay = parseLocalDateTime(paymentDateStr);
    if (!pay || Number.isNaN(pay.getTime())) return null;

    // 오늘(로컬) 기준일: 00시로 맞춰서 날짜만 비교
    const today = stripTime(new Date());

    // 출석일(문자열 배열)을 날짜 key(Set)로 변환: 'YYYY-MM-DD'
    const attendedSet = new Set(
      (Array.isArray(attendedDates) ? attendedDates : []).map((s) => String(s))
    );
    const toKey = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    const payD0 = stripTime(pay);
    const week1Mon = startOfWeekMon(payD0);
    const week1Sun = addDays(week1Mon, 6);

    // 1주차: 결제일~그 주 일요일
    const week1Days = [];
    for (let d = new Date(payD0); d <= week1Sun; d = addDays(d, 1)) {
      week1Days.push(new Date(d));
    }

    // 2~4주차: 다음 주 월~일
    const weeks = [{ label: "1주차", days: week1Days }];
    let nextMon = addDays(week1Sun, 1);
    for (let w = 2; w <= 4; w++) {
      const days = [];
      for (let i = 0; i < 7; i++) days.push(addDays(nextMon, i));
      weeks.push({ label: `${w}주차`, days });
      nextMon = addDays(nextMon, 7);
    }

    // DayDot: 오늘/출석 여부에 따라 스타일 변경
    const DayDot = ({ d }) => {
      const isToday = stripTime(d).getTime() === today.getTime();
      const isAttended = attendedSet.has(toKey(d)); // (미사용 시 항상 false)

      // 기본 배경/텍스트
      let classes =
        "grid place-items-center rounded-full select-none text-[13px] font-semibold transition-all";
      let size = "w-8 h-8";
      let colors = "bg-gray-300 text-gray-700";
      let ring = "";

      if (isAttended) {
        // 추후 출석 디자인: 예) 파란 배경
        colors = "bg-blue-500 text-white";
      }
      if (isToday) {
        // 오늘 강조: 크기 확대 + 링
        size = "w-10 h-10";
        ring = "ring-2 ring-rose-400";
        // 오늘 + 출석일이면 대비를 위해 조금 더 진하게
        colors = isAttended
          ? "bg-blue-600 text-white"
          : "bg-gray-400 text-white";
      }

      return (
        <div
          className={`${size} ${classes} ${colors} ${ring}`}
          title={`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(d.getDate()).padStart(2, "0")}`}
        >
          {d.getDate()}
        </div>
      );
    };

    return (
      <div className="mt-2">
        <div className="flex items-start gap-4 overflow-x-auto">
          {weeks.map((wk) => (
            <div key={wk.label} className="shrink-0">
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
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-sm text-gray-500">내 코스 진행 현황</p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="courseFilter"
            className="text-sm text-gray-600 whitespace-nowrap"
          >
            코스 선택
          </label>
          <select
            id="courseFilter"
            className="border rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {options.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border bg-white p-6 text-center text-gray-500">
          불러오는 중…
        </div>
      )}
      {!loading && err && (
        <div className="rounded-xl border bg-white p-6 text-center text-red-600">
          {err}
        </div>
      )}
      {!loading && !err && filtered.length === 0 && (
        <div className="rounded-xl border bg-white p-6 text-center text-gray-500">
          표시할 코스가 없습니다.
        </div>
      )}

      {!loading &&
        !err &&
        filtered.map((c, idx) => {
          const img = (c?.imageUrl ?? "").trim() || FALLBACK_IMG;
          const cid = Number(c?.courseId);
          const pay = paymentByCourse.get(cid);
          const payDate = pay?.paymentDate;

          return (
            <Fragment key={c?.courseId ?? idx}>
              {/* 결제일 + 주차 미리보기 */}
              <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="text-xs text-gray-500">
                  결제일: {payDate ? payDate : "결제 이력 없음"}
                </div>
                <WeeksPreview paymentDateStr={payDate} />
              </div>

              {/* 코스 카드 */}
              <div className="flex flex-col gap-6 sm:flex-row items-center sm:items-stretch rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                {/* 썸네일 */}
                <div className="w-full sm:w-60 shrink-0">
                  <img
                    src={img}
                    alt="course thumbnail"
                    className="w-full h-36 sm:h-40 object-cover rounded-lg"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                  />
                </div>

                {/* 제목 + 진행률 */}
                <div className="flex-1 w-full">
                  <div className="text-base sm:text-lg font-semibold line-clamp-2">
                    {c?.courseTitle || "제목 없음"}
                  </div>

                  <div className="mt-5">
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-rose-500 transition-all"
                        style={{ width: `${c.__percent}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-600 flex justify-between">
                      <span>달성률</span>
                      <span>{c.__percentText}%</span>
                    </div>
                  </div>
                </div>

                {/* 액션 */}
                <div className="w-full sm:w-auto flex sm:flex-col gap-3 sm:justify-center sm:items-center">
                  <button
                    type="button"
                    className="flex-1 sm:flex-none px-5 py-3 rounded-lg bg-black text-white font-semibold hover:bg-gray-900"
                    onClick={() =>
                      navigate(`/course/${c?.courseId}/lectures`, {
                        state: {
                          courseId: c?.courseId,
                          courseTitle: c?.courseTitle ?? "",
                          imageUrl: c?.imageUrl ?? null,
                          // 강의 페이지에서 총/완료 개수 표시에 사용
                          totalLectures: c?.totalLectures ?? c?.totalCount ?? 0,
                          completedLectures:
                            c?.completedLectures ?? c?.completedCount ?? 0,
                        },
                        replace: false,
                      })
                    }
                    disabled={!c?.courseId}
                  >
                    강의 영상보기
                  </button>
                </div>
              </div>
            </Fragment>
          );
        })}
    </div>
  );
}
