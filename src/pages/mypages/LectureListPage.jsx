// src/pages/LectureListPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getCourseLectures,
  getLectureDetail,
} from "../../services/api/courseApi";

const toHMS = (sec) => {
  const s = Math.max(0, Number(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${m}:${String(r).padStart(2, "0")}`;
};

export default function LectureListPage() {
  const { courseId: courseIdParam } = useParams();
  const courseId = useMemo(() => Number(courseIdParam), [courseIdParam]);

  const accessToken = useSelector((s) => s.auth?.accessToken) ?? null;
  const navigate = useNavigate();
  const { state } = useLocation();
  const courseTitle = state?.courseTitle ?? `코스 #${courseId}`;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [video, setVideo] = useState({
    url: null,
    title: "",
    durationSec: 0,
    description: "",
  });
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoErr, setVideoErr] = useState(null);

  const listAcRef = useRef(null);
  const vidAcRef = useRef(null);

  // --- 강의 목록 로드
  useEffect(() => {
    if (!Number.isFinite(courseId) || courseId <= 0) {
      setErr("유효한 코스 ID가 아닙니다.");
      return;
    }
    listAcRef.current?.abort?.();
    const ac = new AbortController();
    listAcRef.current = ac;

    setLoading(true);
    setErr(null);
    getCourseLectures(courseId, { token: accessToken, signal: ac.signal })
      .then((list) => setRows(list))
      .catch((e) => setErr(e?.message || "강의 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [courseId, accessToken]);

  // --- 선택된 강의 상세(영상 URL) 로드
  useEffect(() => {
    if (!selectedId) {
      setVideo({ url: null, title: "", durationSec: 0, description: "" });
      setVideoErr(null);
      return;
    }
    vidAcRef.current?.abort?.();
    const ac = new AbortController();
    vidAcRef.current = ac;

    setVideoLoading(true);
    setVideoErr(null);
    getLectureDetail(selectedId, { token: accessToken, signal: ac.signal })
      .then((d) =>
        setVideo({
          url: d?.videoUrl ?? null,
          title: d?.title ?? "",
          durationSec: d?.durationSec ?? 0,
          description: d?.description ?? "",
        })
      )
      .catch((e) => {
        setVideo({ url: null, title: "", durationSec: 0, description: "" });
        setVideoErr(e?.message || "영상 정보를 불러오지 못했습니다.");
      })
      .finally(() => setVideoLoading(false));

    return () => ac.abort();
  }, [selectedId, accessToken]);

  const viewRows = useMemo(
    () =>
      (rows ?? []).map((l) => ({
        ...l,
        __percent: Math.round(Math.min(1, Math.max(0, l?.progress ?? 0)) * 100),
        __isActive: l.id === selectedId,
      })),
    [rows, selectedId]
  );

  return (
    // 페이지는 스크롤 가능, 가로는 꽉 차게
    <div className="w-screen min-h-screen bg-white">
      {/* 바깥에 살짝 여백: p-2 */}
      <div className="p-2">
        {/* 상단: 여백(p-2)만큼 높이를 보정한 2열 레이아웃 */}
        <div className="h-[calc(100svh-16px)] overflow-hidden">
          <div
            className="h-full grid gap-4"
            style={{ gridTemplateColumns: "minmax(0,7fr) minmax(320px,3fr)" }}
          >
            {/* LEFT: 비디오 - 부모 높이 꽉 채움 */}
            <section className="h-full min-h-0 flex flex-col">
              <div className="relative flex-1 min-h-0 rounded-2xl border bg-black overflow-hidden">
                {videoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
                    영상 로딩 중…
                  </div>
                )}
                {!videoLoading && videoErr && (
                  <div className="absolute inset-0 flex items-center justify-center text-red-300 text-sm">
                    {videoErr}
                  </div>
                )}
                {!videoLoading && !videoErr && video.url && (
                  <video
                    key={video.url}
                    className="absolute inset-0 w-full h-full"
                    src={video.url}
                    controls
                    playsInline
                  />
                )}
                {!videoLoading && !videoErr && !video.url && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
                    영상이 선택되지 않았습니다.
                  </div>
                )}
              </div>
            </section>

            {/* RIGHT: 목차 - 내부 스크롤 전담 */}
            <aside className="h-full min-h-0">
              <div className="h-full min-h-0 rounded-2xl border bg-white flex flex-col overflow-hidden">
                {/* 상단 고정 헤더 */}
                <div className="shrink-0 border-b">
                  <div className="p-3 sm:p-4 flex items-center justify-between gap-2">
                    <button
                      onClick={() => navigate(-1)}
                      className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      나가기
                    </button>
                    <div className="text-base sm:text-lg font-bold">
                      강의 목차
                    </div>
                  </div>
                  <div className="px-3 sm:px-4 pb-3 text-xs text-gray-500">
                    총 {viewRows.length}개 강의
                  </div>
                </div>

                {/* 스크롤 영역 */}
                <ul className="grow min-h-0 overflow-y-auto divide-y">
                  {loading && (
                    <li className="p-6 text-center text-gray-500">
                      목차 불러오는 중…
                    </li>
                  )}
                  {!loading && err && (
                    <li className="p-6 text-center text-red-600">{err}</li>
                  )}

                  {!loading &&
                    !err &&
                    viewRows.map((l) => (
                      <li
                        key={l.id}
                        className={[
                          "p-4 flex items-start gap-3",
                          l.__isActive ? "bg-rose-50/50" : "",
                        ].join(" ")}
                      >
                        <div className="w-8 shrink-0 text-xs text-gray-500 text-center pt-1">
                          {l.orderIndex}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium line-clamp-2">
                            {l.title}
                          </div>

                          <div className="mt-2">
                            <div className="h-1.5 w-full rounded-full bg-gray-200">
                              <div
                                className="h-1.5 rounded-full bg-rose-500 transition-all"
                                style={{ width: `${l.__percent}%` }}
                              />
                            </div>
                            <div className="mt-1 text-[11px] text-gray-600 flex justify-between">
                              <span>진행률</span>
                              <span>{l.__percent}%</span>
                            </div>
                          </div>

                          <div className="mt-1 text-[11px] text-gray-500">
                            길이: {toHMS(l.durationSec)}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <button
                            type="button"
                            className={[
                              "px-3 py-2 rounded-lg border text-sm font-medium",
                              "hover:bg-gray-50",
                              l.__isActive
                                ? "border-rose-500 text-rose-600"
                                : "",
                            ].join(" ")}
                            onClick={() => setSelectedId(l.id)}
                          >
                            영상 보기
                          </button>
                        </div>
                      </li>
                    ))}

                  {!loading && !err && viewRows.length === 0 && (
                    <li className="p-6 text-center text-gray-500">
                      등록된 강의가 없습니다.
                    </li>
                  )}
                </ul>
              </div>
            </aside>
          </div>
        </div>

        {/* 하단 상세: 선택 시 노출. 페이지 전체 스크롤 발생 */}
        {video.url && (
          <div
            className="mt-4 grid gap-4"
            style={{ gridTemplateColumns: "minmax(0,7fr) minmax(320px,3fr)" }}
          >
            <section className="rounded-2xl border bg-white p-4 sm:p-6">
              <h2 className="text-xl font-bold">{video.title}</h2>
              <p className="mt-1 text-sm text-gray-600">
                길이: {toHMS(video.durationSec)} · 코스: {courseTitle} (ID:{" "}
                {courseId})
              </p>
              {video.description && (
                <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-800">
                  {video.description}
                </div>
              )}
            </section>
            <div />
          </div>
        )}
      </div>
    </div>
  );
}
