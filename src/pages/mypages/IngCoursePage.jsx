// src/pages/IngCoursePage.jsx
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

  const courses = useMemo(
    () => viewRows.filter((c) => c.__percent < 100),
    [viewRows]
  );

  return (
    /* 추가됨: 이 섹션이 ‘페이지 내부 스크롤’ 컨테이너입니다.
       - h-[calc(100vh-120px)] : 헤더/상단여백(대략 120px)을 뺀 가시영역 고정
       - overflow-y-auto       : 섹션 내부에서만 스크롤
       - pb-24                 : 고정/스티키 푸터 높이만큼 여백(가려짐 방지)
       필요 시 120, 24 값을 사이트 헤더/푸터 실제 높이에 맞춰 미세조정하세요. */
    <section
      className="h-[calc(100vh-120px)] overflow-y-auto overscroll-contain"
      style={{ scrollbarGutter: "stable" }}
      aria-label="수강중인 강의 영역"
    >
      <div className="mx-auto max-w-5xl space-y-4 pb-24">
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
            return (
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
            );
          })}
      </div>
    </section>
  );
}
