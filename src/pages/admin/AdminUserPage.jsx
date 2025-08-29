// src/pages/admin/AdminUserPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { searchUsers, adminDeleteUser } from "../../services/api/adminApi";
import { toast } from "../../components/ui/useToast";

const PAGE_SIZE = 10;

export default function AdminUserPage() {
  const accessToken = useSelector((s) => s.auth?.accessToken) ?? null;
  const me = useSelector((s) => s.auth?.user) ?? null;

  const [form, setForm] = useState({ name: "", phoneSuffix: "", role: "" });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [page, setPage] = useState(1);
  const [delLoadingId, setDelLoadingId] = useState(null);
  const acRef = useRef(null);

  const load = async (q = form) => {
    acRef.current?.abort?.();
    const ac = new AbortController();
    acRef.current = ac;

    setLoading(true);
    setErr(null);
    try {
      const data = await searchUsers(
        {
          name: q.name || undefined,
          phoneSuffix: q.phoneSuffix || undefined,
          role: q.role || undefined,
        },
        {
          signal: ac.signal,
          token: accessToken || undefined,
        }
      );
      setRows(data);
      setPage(1); // 검색할 때마다 1페이지로
    } catch (e) {
      if (e.name !== "CanceledError" && e.name !== "AbortError") {
        setErr(e.message || "검색 중 오류가 발생했습니다.");
        toast.warning(e.message || "검색 중 오류가 발생했습니다.");
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
    const empty = { name: "", phoneSuffix: "", role: "" };
    setForm(empty);
    load(empty);
  };

  // 보호 대상: 본인 계정 또는 ADMIN/SUPPORT
  const isProtectedUser = (u) => {
    const roles = Array.isArray(u?.roles) ? u.roles : [];
    const elevated =
      roles.includes("ROLE_ADMIN") || roles.includes("ROLE_SUPPORT");
    const isMe = me?.id && u?.id && Number(me.id) === Number(u.id);
    return elevated || isMe;
  };

  const handleDelete = async (u) => {
    if (!u?.id) return;
    if (isProtectedUser(u)) return;

    const name = u?.name || "";
    const email = u?.email || "";
    const ok = window.confirm(
      `정말 강제 탈퇴하시겠습니까?\n\n대상: ${name}${
        email ? ` (${email})` : ""
      }\n이 작업은 되돌릴 수 없습니다.`
    );
    if (!ok) return;

    try {
      setDelLoadingId(u.id);
      const { message } = await adminDeleteUser(u.id, {
        token: accessToken || undefined,
      });
      // 성공 시 재조회(목록/페이지 갱신 안정적)
      await load(form);
      console.log("message:", message);
      toast.success(message || "탈퇴 처리되었습니다.");
    } catch (e) {
      console.error(e?.message || "강제 탈퇴 요청에 실패했습니다.");
    } finally {
      setDelLoadingId(null);
    }
  };

  const RoleBadge = ({ role }) => (
    <span
      className={
        "px-1.5 py-0.5 rounded text-[10px] font-bold leading-none " +
        (role === "ROLE_ADMIN"
          ? "bg-red-50 text-red-700 border border-red-200"
          : role === "ROLE_SUPPORT"
          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
          : "bg-gray-50 text-gray-700 border border-gray-200")
      }
    >
      {role?.replace(/^ROLE_/, "")}
    </span>
  );

  const Avatar = ({ name, imageUrl }) => {
    const initials =
      (name || "")
        .trim()
        .split(/\s+/)
        .map((s) => s[0])
        .join("")
        .slice(0, 2) || "U";
    return imageUrl ? (
      <img
        src={imageUrl}
        alt={name || "avatar"}
        className="h-7 w-7 rounded-full object-cover border"
      />
    ) : (
      <div className="h-7 w-7 rounded-full grid place-items-center bg-gray-100 text-gray-600 text-[11px] border">
        {initials}
      </div>
    );
  };

  const formatPhone = (v) => {
    if (!v) return "";
    const s = String(v).replace(/\D/g, "");
    if (s.length === 11) return s.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    if (s.length === 10)
      return s.replace(/(\d{2,3})(\d{3,4})(\d{4})/, "$1-$2-$3");
    return v; // 숫자 길이 다르면 원문 표시
  };

  // ---- Pagination 계산 ----
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = Math.min(rows.length, startIdx + PAGE_SIZE);
  const pageRows = useMemo(
    () => rows.slice(startIdx, endIdx),
    [rows, startIdx, endIdx]
  );

  return (
    <div className="space-y-1 pb-2">
      <h1 className="text-lg font-bold">유저관리 페이지</h1>

      {/* 검색 폼 - 컴팩트 */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-xl p-3 grid gap-2 md:grid-cols-4 text-xs"
      >
        <div className="flex flex-col">
          <label className="text-[11px] text-gray-500 mb-1">이름</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="예) 홍길동"
            className="border rounded px-2 py-1.5"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] text-gray-500 mb-1">전화 뒷자리</label>
          <input
            name="phoneSuffix"
            value={form.phoneSuffix}
            onChange={handleChange}
            placeholder="예) 1234"
            className="border rounded px-2 py-1.5"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] text-gray-500 mb-1">권한</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="border rounded px-2 py-1.5"
          >
            <option value="">전체</option>
            <option value="ROLE_ADMIN">ADMIN</option>
            <option value="ROLE_SUPPORT">SUPPORT</option>
            <option value="ROLE_MEMBER">MEMBER</option>
          </select>
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
        </div>
      </form>

      {/* 상태 메시지 */}
      {err && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {err}
        </div>
      )}

      {/* 결과 테이블 - 컴팩트 + 페이지네이션 */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b text-xs text-gray-600">
          <div>
            총 <span className="font-bold">{rows.length}</span>명
            {rows.length > 0 && (
              <span className="ml-2 text-gray-400">
                ( {startIdx + 1}–{endIdx} 표시 )
              </span>
            )}
          </div>
          {loading && <div className="text-gray-500">불러오는 중…</div>}
        </div>

        {rows.length === 0 && !loading ? (
          <div className="p-5 text-xs text-gray-500">검색 결과가 없습니다.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs leading-5">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2">ID</th>
                    <th className="text-left px-3 py-2">사용자</th>
                    <th className="text-left px-3 py-2">이메일</th>
                    <th className="text-left px-3 py-2">전화번호</th>
                    <th className="text-left px-3 py-2">권한</th>
                    <th className="text-left px-3 py-2">소셜</th>
                    <th className="text-left px-3 py-2">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="px-3 py-2 whitespace-nowrap">{u.id}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={u.name} imageUrl={u.imageUrl} />
                          <div className="font-medium">{u.name || "—"}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {u.email || "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatPhone(u.phone)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {(u.roles || []).map((r) => (
                            <RoleBadge key={r} role={r} />
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {u.social ? (
                          <span className="text-green-700 bg-green-50 border border-green-200 text-[10px] px-1.5 py-0.5 rounded">
                            소셜
                          </span>
                        ) : (
                          <span className="text-gray-600 bg-gray-50 border border-gray-200 text-[10px] px-1.5 py-0.5 rounded">
                            일반
                          </span>
                        )}
                      </td>

                      {/* [수정됨] 관리(강제 탈퇴) 칼럼: 
          - u.isDeleted === true → '탈퇴회원' 뱃지
          - 그 외: 보호대상이면 '보호됨', 아니면 '강제 탈퇴' 버튼 */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {u.isDeleted ? (
                          <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                            탈퇴회원
                          </span>
                        ) : isProtectedUser(u) ? (
                          <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                            보호됨
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            disabled={delLoadingId === u.id || loading}
                            className="px-1 text-[11px] rounded border text-red-700 border-red-300 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                          >
                            {delLoadingId === u.id ? "처리 중..." : "강제 탈퇴"}
                          </button>
                        )}
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

                {/* 페이지 번호 버튼 (간단 구현) */}
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
    </div>
  );
}
