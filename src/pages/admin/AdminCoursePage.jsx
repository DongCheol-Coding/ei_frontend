// src/pages/admin/AdminCoursePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { getCourses } from "../../services/api/adminApi";
import CourseCreateModal from "../../components/admin/CourseCreateModal";

const PAGE_SIZE = 10;
const krw = (n) => new Intl.NumberFormat("ko-KR").format(Number(n ?? 0));

export default function AdminCoursePage() {
  const accessToken = useSelector((s) => s.auth?.accessToken) ?? null;

  // 검색 폼 상태 (디자인 동일: 인풋 3개 + 버튼 영역)
  const [form, setForm] = useState({
    title: "",
    published: "", // "", "true", "false"
    minPrice: "",
  });

  const [rows, setRows] = useState([]); // 필터링 결과를 담는 배열
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [page, setPage] = useState(1);
  const acRef = useRef(null);

  const [createOpen, setCreateOpen] = useState(false);

  const load = async (q = form) => {
    acRef.current?.abort?.();
    const ac = new AbortController();
    acRef.current = ac;

    setLoading(true);
    setErr(null);
    try {
      // 전체 강의 목록 조회
      const all = await getCourses({
        signal: ac.signal,
        token: accessToken || undefined,
      });

      // 클라이언트 측 필터링
      let filtered = all;
      if (q.title?.trim()) {
        const key = q.title.trim().toLowerCase();
        filtered = filtered.filter((c) =>
          (c.title || "").toLowerCase().includes(key)
        );
      }
      if (q.published === "true" || q.published === "false") {
        const want = q.published === "true";
        filtered = filtered.filter((c) => Boolean(c.published) === want);
      }
      if (q.minPrice?.trim()) {
        const min = Number(q.minPrice.replace(/\D/g, "")) || 0;
        filtered = filtered.filter((c) => Number(c.price ?? 0) >= min);
      }

      setRows(filtered);
      setPage(1); // 검색할 때마다 1페이지로
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
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    load(form);
  };
  const handleReset = () => {
    const empty = { title: "", published: "", minPrice: "" };
    setForm(empty);
    load(empty);
  };

  const Thumb = ({ title, imageUrl }) => {
    const initials =
      (title || "")
        .trim()
        .split(/\s+/)
        .map((s) => s[0])
        .join("")
        .slice(0, 2) || "C";
    return imageUrl ? (
      <img
        src={imageUrl}
        alt={title || "thumbnail"}
        className="h-7 w-7 rounded object-cover border"
      />
    ) : (
      <div className="h-7 w-7 rounded grid place-items-center bg-gray-100 text-gray-600 text-[11px] border">
        {initials}
      </div>
    );
  };

  const PublishedBadge = ({ value }) =>
    value ? (
      <span className="text-green-700 bg-green-50 border border-green-200 text-[10px] px-1.5 py-0.5 rounded">
        공개
      </span>
    ) : (
      <span className="text-gray-600 bg-gray-50 border border-gray-200 text-[10px] px-1.5 py-0.5 rounded">
        비공개
      </span>
    );

  // ---- Pagination 계산 (디자인 동일) ----
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = Math.min(rows.length, startIdx + PAGE_SIZE);
  const pageRows = useMemo(
    () => rows.slice(startIdx, endIdx),
    [rows, startIdx, endIdx]
  );

  return (
    <div className="space-y-1 pb-2">
      <h1 className="text-lg font-bold">강의 관리 페이지</h1>

      {/* 검색 폼 - 컴팩트 (레이아웃 동일) */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-xl p-3 grid gap-2 md:[grid-template-columns:2fr_0.8fr_1fr_auto] text-xs"
      >
        <div className="flex flex-col">
          <label className="text-[11px] text-gray-500 mb-1">제목</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="예) 동철코딩"
            className="border rounded px-2 py-1.5"
          />
        </div>

        <div className="flex flex-col w-fit">
          <label className="text-[11px] text-gray-500 mb-1">공개 여부</label>
          <select
            name="published"
            value={form.published}
            onChange={handleChange}
            className="border rounded px-2 py-1.5 w-28"
          >
            <option value="">전체</option>
            <option value="true">공개</option>
            <option value="false">비공개</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] text-gray-500 mb-1">
            최소 가격(원)
          </label>
          <input
            name="minPrice"
            value={form.minPrice}
            onChange={handleChange}
            placeholder="예) 100000"
            inputMode="numeric"
            className="border rounded px-2 py-1.5"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 rounded-md bg-black text-white disabled:opacity-60"
          >
            {loading ? "검색 중..." : "검색"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-3 py-1.5 rounded-md border"
          >
            초기화
          </button>

          <div className="ml-6 sm:ml-8">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="px-3 py-1.5 rounded-md text-white font-bold bg-blue-600 border"
            >
              강의등록
            </button>
          </div>
        </div>
      </form>

      {/* 상태 메시지 */}
      {err && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {err}
        </div>
      )}

      {/* 결과 테이블 */}
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
                    <th className="text-left px-3 py-2">ID</th>
                    <th className="text-left px-3 py-2">코스</th>
                    <th className="text-left px-3 py-2">가격</th>
                    <th className="text-left px-3 py-2">공개</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-3 py-2 whitespace-nowrap">{c.id}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Thumb title={c.title} imageUrl={c.imageUrl} />
                          <div className="font-medium">{c.title || "—"}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        ₩ {krw(c.price)}
                      </td>
                      <td className="px-3 py-2">
                        <PublishedBadge value={c.published} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* pagination (동일 UI) */}
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
      <CourseCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        token={accessToken}
        onCreated={() => {
          setCreateOpen(false);
          load(); // 등록 성공 후 목록 새로고침
        }}
      />
    </div>
  );
}
