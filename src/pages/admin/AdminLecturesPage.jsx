// src/pages/admin/AdminCourseLecturesPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getCourseLectures, deleteLecture } from "../../services/api/courseApi";
import LectureCreateModal from "../../components/admin/LectureCreateModal";

const PAGE_SIZE = 20;
const pct = (n) => `${Math.round(Number(n ?? 0) * 100)}%`; // 진행률 컬럼은 주석 처리 상태
const toHMS = (sec) => {
  const s = Math.max(0, Number(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${m}:${String(r).padStart(2, "0")}`;
};

export default function AdminCourseLecturesPage() {
  const { courseId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const accessToken = useSelector((s) => s.auth?.accessToken) ?? null;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [page, setPage] = useState(1);
  const acRef = useRef(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const courseTitle = state?.courseTitle || `코스 ${courseId}`;

  const load = async () => {
    acRef.current?.abort?.();
    const ac = new AbortController();
    acRef.current = ac;

    setLoading(true);
    setErr(null);
    try {
      const list = await getCourseLectures(courseId, {
        token: accessToken || undefined,
        signal: ac.signal,
      });
      setRows(list);
      setPage(1);
    } catch (e) {
      if (e.name !== "CanceledError" && e.name !== "AbortError") {
        setErr(e.message || "강의 목록을 불러오는 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => acRef.current?.abort?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, accessToken]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = Math.min(rows.length, startIdx + PAGE_SIZE);
  const pageRows = useMemo(
    () => rows.slice(startIdx, endIdx),
    [rows, startIdx, endIdx]
  );
  const handleDeleteClick = async (lectureId) => {
    if (!lectureId) return;
    if (!window.confirm("정말로 이 강의를 삭제하시겠습니까?")) return;
    try {
      setDeletingId(lectureId);
      await deleteLecture(lectureId, { token: accessToken || undefined });
      // alert("삭제되었습니다."); // 필요 시 안내
      await load(); // 목록 새로고침
    } catch (e) {
      alert(e?.message || "삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-2 pb-3">
      {/* 상단 바: 좌측(뒤로/제목) + 우측(강의 영상 등록) */}
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
            강의 목록 — <span className="text-gray-600">{courseTitle}</span>
          </h1>
        </div>

        {/* 강의 영상 등록 버튼 */}
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="px-3 py-1.5 text-xs rounded-lg font-bold bg-blue-500 text-white hover:bg-blue-600"
        >
          강의 영상 등록
        </button>
      </div>

      {err && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {err}
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b text-xs text-gray-600">
          <div>
            총 <span className="font-bold">{rows.length}</span>개
            {rows.length > 0 && (
              <span className="ml-2 text-gray-400">
                ( {startIdx + 1}–{endIdx} 표시 )
              </span>
            )}
          </div>
          {loading && <div className="text-gray-500">불러오는 중…</div>}
        </div>

        {rows.length === 0 && !loading ? (
          <div className="p-5 text-xs text-gray-500">
            등록된 강의가 없습니다.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs leading-5">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 w-16">순서</th>
                    <th className="text-left px-3 py-2">강의명</th>
                    <th className="text-center px-3 py-2 w-18">영상 길이</th>
                    <th className="text-center px-3 py-2 w-20">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {l.orderIndex}
                      </td>

                      {/* 기존 */}
                      {/* <td className="px-3 py-2">{l.title || "—"}</td> */}

                      {/* 변경: 제목 클릭 시 상세 페이지로 이동 */}
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/lectures/${l.id}`, {
                              state: { courseId, courseTitle },
                            })
                          }
                          className="text-blue-600 hover:underline"
                          title="강의 상세 보기"
                        >
                          {l.title || "—"}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center">{l.durationSec}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(l.id)}
                          disabled={deletingId === l.id}
                          className="px-2 py-1 rounded text-red-500 hover:text-red-600 hover:underline hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {deletingId === l.id ? "삭제 중..." : "삭제"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50">
              <div className="text-[11px] text-gray-500">
                {page} / {pageCount} 페이지
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="h-7 px-2 border rounded text-xs disabled:opacity-50"
                >
                  « 처음
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-7 px-2 border rounded text-xs disabled:opacity-50"
                >
                  ‹ 이전
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={
                      "h-7 w-7 border rounded text-xs " +
                      (n === page
                        ? "bg-black text-white border-black"
                        : "bg-white hover:bg-gray-100")
                    }
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  className="h-7 px-2 border rounded text-xs disabled:opacity-50"
                >
                  다음 ›
                </button>
                <button
                  onClick={() => setPage(pageCount)}
                  disabled={page === pageCount}
                  className="h-7 px-2 border rounded text-xs disabled:opacity-50"
                >
                  마지막 »
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <LectureCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        token={accessToken || undefined}
        courseId={courseId}
        onCreated={() => {
          setCreateOpen(false);
          load(); // 등록 후 목록 새로고침
        }}
      />
    </div>
  );
}
