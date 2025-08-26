import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useOutletContext, useNavigate } from "react-router-dom";
import { getMyCourses } from "../../services/api/myPageApi";

const FALLBACK_IMG = "https://placehold.co/300x200";

export default function IngCoursePage() {
  const { coursesProgress: initial = [] } = useOutletContext() ?? {};
  const accessToken = useSelector((s) => s.auth?.accessToken) ?? null;
  const navigate = useNavigate();

  const [rows, setRows] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const acRef = useRef(null);

  useEffect(() => {
    acRef.current?.abort?.();
    const ac = new AbortController();
    acRef.current = ac;

    setLoading(true);
    setErr(null);

    getMyCourses({ accessToken, signal: ac.signal })
      .then((list) => {
        setRows(Array.isArray(list) ? list : []);
      })
      .catch((e) =>
        setErr(e?.message || "수강중인 강의를 가져오지 못했습니다.")
      )
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [accessToken]);

  const clampPercent = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.min(100, Math.max(0, n));
  };

  const fmtPercent = (n) => {
    // 정수면 정수로, 아니면 소수 1자리
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  };

  // progressPercent(신규 스키마)를 우선 사용. 누락 시 기존 progress 퍼센트도 fallback.
  const viewRows = useMemo(
    () =>
      (rows ?? []).map((c) => {
        const percentRaw = c?.progressPercent ?? c?.progress ?? 0; // progress는 구버전 호환
        const __percent = clampPercent(percentRaw);
        return { ...c, __percent };
      }),
    [rows]
  );

  // 진행 중만 노출: 응답의 completed === false 우선
  const courses = useMemo(
    () =>
      viewRows.filter(
        (c) =>
          c?.completed === false || // 신규 스키마 기준
          (c?.completed === undefined && c.__percent < 100) // 안전장치
      ),
    [viewRows]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">수강중인 강의</h1>
        <p className="text-sm text-gray-500">수강중인 강의 목록입니다.</p>
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

      {!loading && !err && courses.length === 0 && (
        <div className="rounded-xl border bg-white p-6 text-center text-gray-500">
          수강중인 강의가 없습니다.
        </div>
      )}

      {!loading &&
        !err &&
        courses.map((c, idx) => {
          const img = (c?.imageUrl ?? "").trim() || FALLBACK_IMG;
          const percentText = fmtPercent(c.__percent);

          return (
            <div
              key={c?.courseId ?? idx}
              className="flex flex-col gap-6 sm:flex-row items-center sm:items-stretch rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
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
                    <span>{percentText}%</span>
                  </div>
                </div>
              </div>

              {/* 우측 액션 */}
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
          );
        })}
    </div>
  );
}
