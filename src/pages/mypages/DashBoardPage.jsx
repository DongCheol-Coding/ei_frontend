// src/pages/MyPageLandingPage.jsx
/*
[변경 요약]
- 상위(MyPageLayout)에서 내려준 latestPaidCourseId와 payments를 사용.
- 드롭박스에서 "전체" 제거.
- 옵션 정렬: [latestPaidCourseId가 있다면 최상단] -> [나머지 courseId 오름차순].
- 초기 선택값을 정렬된 첫 옵션으로 설정.
- 선택된 courseId의 카드만 표시.
- [추가됨] 부모 payments에서 courseId가 같은 결제의 paymentDate를 찾아 카드에 표시.
*/
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useOutletContext, useNavigate } from "react-router-dom";
import { getMyCourses } from "../../services/api/myPageApi";

const FALLBACK_IMG = "https://placehold.co/300x200";

export default function MyPageLandingPage() {
  // [수정됨] payments 함께 수신
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

  const toPct = (p, done, total) => {
    let val =
      p != null && !Number.isNaN(p)
        ? Number(p)
        : done != null && total
        ? Math.min(1, Math.max(0, done / total))
        : 0;
    val = Math.min(1, Math.max(0, val));
    return Math.round(val * 100);
  };

  const viewRows = useMemo(
    () =>
      (rows ?? []).map((c) => ({
        ...c,
        __percent: toPct(c?.progress, c?.completedCount, c?.totalCount),
      })),
    [rows]
  );

  // [추가됨] 코스별 최신 결제 찾기(동일 코스 다중 결제 대비)
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

  // 드롭박스 옵션(중복 제거) + 정렬 규칙 적용
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

  // 옵션 준비 후 초기 선택값 설정(또는 보정)
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

  function WeeksPreview({ paymentDateStr }) {
    if (!paymentDateStr) return null;
    const pay = parseLocalDateTime(paymentDateStr);
    if (!pay || Number.isNaN(pay.getTime())) return null;

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
      for (let i = 0; i < 7; i++) {
        days.push(addDays(nextMon, i));
      }
      weeks.push({ label: `${w}주차`, days });
      nextMon = addDays(nextMon, 7);
    }

    const DayDot = ({ d }) => (
      <div
        className="w-8 h-8 rounded-full grid place-items-center text-[13px] font-semibold select-none bg-gray-300 text-gray-700"
        title={`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(d.getDate()).padStart(2, "0")}`}
      >
        {d.getDate()}
      </div>
    );

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
          const payDate = pay?.paymentDate; // 원문 문자열 그대로 표시

          return (
            <>
              <div className="flex flex-col gap-6 sm:flex-row items-center sm:items-stretch rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mt-1 text-xs text-gray-500">
                  결제일: {payDate ? payDate : "결제 이력 없음"}
                  <WeeksPreview paymentDateStr={payDate} />
                </div>
              </div>
              <div
                key={c?.courseId ?? idx}
                className="flex flex-col gap-6 sm:flex-row items-center sm:items-stretch rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
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
                      <span>{c.__percent}%</span>
                    </div>
                  </div>
                </div>

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
            </>
          );
        })}
    </div>
  );
}
