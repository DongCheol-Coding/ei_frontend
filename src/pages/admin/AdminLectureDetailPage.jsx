// src/pages/admin/AdminLectureDetailPage.jsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getLectureDetail } from "../../services/api/courseApi";

const toHMS = (sec) => {
  const s = Math.max(0, Number(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${m}:${String(r).padStart(2, "0")}`;
};

export default function AdminLectureDetailPage() {
  const { lectureId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation(); // { courseId, courseTitle } (선택)
  const accessToken = useSelector((s) => s.auth?.accessToken) ?? null;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const d = await getLectureDetail(lectureId, {
          token: accessToken || undefined,
          signal: ac.signal,
        });
        setDetail(d);
      } catch (e) {
        setErr(e?.message || "강의 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [lectureId, accessToken]);

  const courseTitle =
    state?.courseTitle || (detail?.courseId ? `코스 ${detail.courseId}` : "");
  const headerTitle = detail?.title || `강의 ${lectureId}`;

  return (
    <div className="space-y-3 pb-6">
      {/* 상단 바 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-2 py-1 border rounded text-xs"
            aria-label="뒤로"
          >
            ← 뒤로
          </button>
          <h1 className="text-lg font-bold">
            {headerTitle}{" "}
            {courseTitle && (
              <span className="text-gray-600">— {courseTitle}</span>
            )}
          </h1>
        </div>
      </div>

      {/* 본문 */}
      <div className="bg-white border rounded-2xl p-4">
        {loading && <div className="text-sm text-gray-500">불러오는 중…</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}

        {!loading && !err && detail && (
          <div className="space-y-4">
            {/* 비디오 */}
            <div className="w-full">
              {detail.videoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={detail.videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full max-w-3xl rounded-lg border"
                    onError={(e) => {
                      // 여전히 안 될 경우 콘솔에서 에러 확인에 도움
                      // (네트워크 탭과 함께 확인해주세요)
                      console.warn("Video error:", e.currentTarget.error);
                    }}
                  />
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                    <span>영상 길이: {toHMS(detail.durationSec)}</span>
                    <a
                      href={detail.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                      title="새 창에서 열기"
                    >
                      새 창에서 열기
                    </a>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-600">
                  재생할 영상 URL이 없습니다.
                </div>
              )}
            </div>

            {/* 정보 */}
            <div className="grid gap-2 text-sm">
              <div>
                <span className="text-gray-500 text-[11px]">제목</span>
                <div>{detail.title}</div>
              </div>
              {detail.description && (
                <div>
                  <span className="text-gray-500 text-[11px]">설명</span>
                  <div className="whitespace-pre-wrap">
                    {detail.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
