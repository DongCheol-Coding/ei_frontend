// src/pages/LectureListPage.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getCourseLectures,
  getLectureDetail,
} from "../../services/api/courseApi";
// 진행도 업데이트 API
import { updateLectureProgress } from "../../services/api/myPageApi";

// 진행도 자동 저장 설정
const SAVE_EVERY_SEC = 10; // 주기 저장(10초마다). 5로 줄이면 5초 저장
const FIRST_SAVE_AT_SEC = 2; // 최초 저장 임계치(2초 도달 시 1회 저장)
const LAST_FLUSH_GUARD_MS = 1200; // 연속 플러시 최소 간격(ms)

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

  // 비디오/진행도 관련 refs
  const videoRef = useRef(null);
  const progressAcRef = useRef(null);
  const lastSavedBucketRef = useRef(-1); // 버킷 기반 중복 방지
  const firstSavedRef = useRef(false); // 최초 임계치(2초) 저장 여부
  const lastFlushAtRef = useRef(0); // 플러시 스팸 방지
  const canonicalDurRef = useRef(0); // 완료 시간 계산용 기준 길이(초)

  const selectedRow = useMemo(
    () => (rows ?? []).find((l) => l.id === selectedId) || null,
    [rows, selectedId]
  );

  // 강의 목록 로드
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

  // 선택된 강의 상세(영상 URL) 로드
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

    // 새 강의 선택 시 초기화
    lastSavedBucketRef.current = -1;
    firstSavedRef.current = false;
    lastFlushAtRef.current = 0;
    canonicalDurRef.current = 0;

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

  // 진행도 저장(요청 중복/폭주 방지)
  const postProgress = useCallback(
    async (sec) => {
      if (!Number.isInteger(sec) || sec < 0) return;
      if (!selectedId) return;

      progressAcRef.current?.abort?.();
      const ac = new AbortController();
      progressAcRef.current = ac;

      try {
        await updateLectureProgress({
          lectureId: selectedId,
          watchedSec: sec,
          accessToken,
          signal: ac.signal,
        });
      } catch {
        // 무음 처리(원하면 toast로 변경)
      }
    },
    [selectedId, accessToken]
  );

  // 이탈/새로고침 플러시(keepalive fetch 또는 sendBeacon)
  const flushProgressOnExit = useCallback(
    (sec) => {
      if (!selectedId) return;
      const url = `/api/lectures/${selectedId}/progress`;
      const payload = JSON.stringify({
        watchedSec: Math.max(0, Math.floor(sec || 0)),
      });

      try {
        if (accessToken) {
          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: payload,
            keepalive: true,
            credentials: "include",
          }).catch(() => {});
        } else {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon?.(url, blob);
        }
      } catch {}
    },
    [selectedId, accessToken]
  );

  // 재생 중 자동 저장: 최초 2초 1회 + SAVE_EVERY_SEC 버킷마다
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || v.paused) return;

    const t = Math.floor(v.currentTime || 0);

    // 최초 임계치 저장
    if (!firstSavedRef.current && t >= FIRST_SAVE_AT_SEC) {
      firstSavedRef.current = true;
      lastSavedBucketRef.current = Math.floor(t / SAVE_EVERY_SEC);
      postProgress(t);
      return;
    }

    // 버킷 저장
    const bucket = Math.floor(t / SAVE_EVERY_SEC);
    if (bucket > lastSavedBucketRef.current) {
      lastSavedBucketRef.current = bucket;
      postProgress(t);
    }
  }, [postProgress]);

  // 시킹 직후 저장(점프 후 즉시 이탈 대비)
  const handleSeeked = useCallback(() => {
    const v = videoRef.current;
    const t = Math.floor(v?.currentTime || 0);
    const bucket = Math.floor(t / SAVE_EVERY_SEC);

    if (!firstSavedRef.current && t >= FIRST_SAVE_AT_SEC) {
      firstSavedRef.current = true;
    }
    if (bucket > lastSavedBucketRef.current) {
      lastSavedBucketRef.current = bucket;
      postProgress(t);
    }
  }, [postProgress]);

  // 일시정지 시 플러시(스팸 방지)
  const handlePause = useCallback(() => {
    const now = Date.now();
    if (now - lastFlushAtRef.current < LAST_FLUSH_GUARD_MS) return;

    const t = Math.floor(videoRef.current?.currentTime || 0);
    lastFlushAtRef.current = now;
    postProgress(t);
  }, [postProgress]);

  // 종료 시 최종 시간(초) 저장 + 즉시 flush
  const handleEnded = useCallback(() => {
    const v = videoRef.current;
    const domDur = Number.isFinite(v?.duration) ? v.duration : 0;
    const apiDur = Number.isFinite(video?.durationSec) ? video.durationSec : 0;
    const base =
      canonicalDurRef.current || apiDur || domDur || v?.currentTime || 0;

    const endSec = Math.max(1, Math.round(base)); // 29.98 → 30 등 반올림
    lastSavedBucketRef.current = Math.floor(endSec / SAVE_EVERY_SEC);
    firstSavedRef.current = true;

    postProgress(endSec);
    flushProgressOnExit(endSec);
  }, [postProgress, flushProgressOnExit, video?.durationSec]);

  // 메타 로드 시 기준 길이 확정 + 이전 진행률 위치로 점프
  const handleLoadedMetadata = useCallback(
    (e) => {
      const v = e.currentTarget;
      const domDur = Number.isFinite(v?.duration) ? Math.floor(v.duration) : 0;
      const apiDur = Number.isFinite(video?.durationSec)
        ? Math.floor(video.durationSec)
        : 0;

      canonicalDurRef.current = apiDur > 0 ? apiDur : domDur;

      const baseDur = canonicalDurRef.current || 0;
      const pct = Math.max(0, Math.min(1, selectedRow?.progress ?? 0));
      const fromSec = Math.floor(baseDur * pct);

      if (
        fromSec > 0 &&
        v &&
        Number.isFinite(v.duration) &&
        fromSec < v.duration
      ) {
        try {
          v.currentTime = fromSec;
        } catch {}
        lastSavedBucketRef.current = Math.floor(fromSec / SAVE_EVERY_SEC) - 1;
        firstSavedRef.current = fromSec >= FIRST_SAVE_AT_SEC;
      } else {
        lastSavedBucketRef.current = -1;
        firstSavedRef.current = false;
      }
    },
    [selectedRow, video?.durationSec]
  );

  // 탭 이탈/닫힘 시 최종 플러시
  useEffect(() => {
    const onHidden = () => {
      if (!selectedId) return;
      const t = Math.floor(videoRef.current?.currentTime || 0);
      flushProgressOnExit(t);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHidden();
    };
    const onPageHide = () => onHidden();

    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [selectedId, flushProgressOnExit]);

  // 나가기 버튼: 현재 시점 플러시 후 이동
  const handleExit = useCallback(() => {
    if (selectedId) {
      const t = Math.floor(videoRef.current?.currentTime || 0);
      flushProgressOnExit(t);
    }
    navigate(-1);
  }, [selectedId, navigate, flushProgressOnExit]);

  return (
    <div className="w-screen min-h-screen bg-white">
      <div className="p-2">
        <div className="h-[calc(100svh-16px)] overflow-hidden">
          <div
            className="h-full grid gap-4"
            style={{ gridTemplateColumns: "minmax(0,7fr) minmax(320px,3fr)" }}
          >
            {/* LEFT: 비디오 */}
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
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full"
                    src={video.url}
                    controls
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onSeeked={handleSeeked}
                    onPause={handlePause}
                    onEnded={handleEnded}
                    onLoadedMetadata={handleLoadedMetadata}
                  />
                )}
                {!videoLoading && !videoErr && !video.url && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
                    영상이 선택되지 않았습니다.
                  </div>
                )}
              </div>
            </section>

            {/* RIGHT: 목차 */}
            <aside className="h-full min-h-0">
              <div className="h-full min-h-0 rounded-2xl border bg-white flex flex-col overflow-hidden">
                <div className="shrink-0 border-b">
                  <div className="p-3 sm:p-4 flex items-center justify-between gap-2">
                    <button
                      onClick={handleExit}
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
