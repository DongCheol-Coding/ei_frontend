// src/pages/admin/AdminDashboardPage.jsx
// [대시보드] 회원/강의 요약 카드 + 최근 목록 테이블.
// - 초기 데이터는 OutletContext에서 받아 즉시 표시, 마운트 시 최신 데이터로 새로고침
// - 사용 API 예시: getAllUsers, getAllCourses (이름만 다르면 import 부분만 맞춰주세요)

import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useSelector } from "react-redux";
// 필요에 맞게 경로/함수명 조정하세요.
import { searchUsers } from "../../services/api/adminApi";
import { getCourses } from "../../services/api/courseApi";

const krw = (n) => new Intl.NumberFormat("ko-KR").format(Number(n ?? 0));

export default function AdminDashboardPage() {
  // 레이아웃에서 전달해줄 수도 있는 초기값(없어도 동작)
  const { users: initialUsers = [], courses: initialCourses = [] } =
    useOutletContext() ?? {};

  const accessToken = useSelector((s) => s.auth?.accessToken) ?? null;

  const [users, setUsers] = useState(initialUsers);
  const [courses, setCourses] = useState(initialCourses);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const acRef = useRef(null);

  useEffect(() => {
    acRef.current?.abort?.();
    const ac = new AbortController();
    acRef.current = ac;

    setLoading(true);
    setErr(null);

    // 동시에 가져오기
    Promise.all([
      searchUsers({ accessToken, signal: ac.signal }),
      getCourses({ accessToken, signal: ac.signal }),
    ])
      .then(([u, c]) => {
        setUsers(Array.isArray(u) ? u : u?.data ?? []);
        setCourses(Array.isArray(c) ? c : c?.data ?? []);
      })
      .catch((e) =>
        setErr(e?.message || "대시보드 데이터를 불러오지 못했습니다.")
      )
      .finally(() => setLoading(false));

    return () => ac.abort?.();
  }, [accessToken]);

  // [대시보드] 통계 계산
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const hasRole = (u, r) =>
      Array.isArray(u?.roles) &&
      u.roles.map((x) => String(x).toUpperCase()).includes(r);

    const adminCount = users.filter((u) => hasRole(u, "ROLE_ADMIN")).length;
    const supportCount = users.filter((u) => hasRole(u, "ROLE_SUPPORT")).length;
    const memberCount = users.filter((u) => hasRole(u, "ROLE_MEMBER")).length;

    const socialCount = users.filter((u) => !!u?.social).length;
    const localCount = totalUsers - socialCount;

    const deletedCount = users.filter(
      (u) =>
        String(u?.email || "").startsWith("deleted-") ||
        String(u?.name || "").includes("탈퇴")
    ).length;

    const totalCourses = courses.length;
    const publishedCount = courses.filter((c) => !!c?.published).length;
    const unpublishedCount = totalCourses - publishedCount;
    const priceSum = courses.reduce((acc, c) => acc + Number(c?.price || 0), 0);

    // 최근 항목(단순히 id 기준 내림차순)
    const latestUsers = [...users].sort((a, b) => b.id - a.id).slice(0, 5);
    const latestCourses = [...courses].sort((a, b) => b.id - a.id).slice(0, 5);

    return {
      totalUsers,
      adminCount,
      supportCount,
      memberCount,
      socialCount,
      localCount,
      deletedCount,
      totalCourses,
      publishedCount,
      unpublishedCount,
      priceSum,
      latestUsers,
      latestCourses,
    };
  }, [users, courses]);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">대시보드</h1>

      {err && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {err}
        </div>
      )}

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="총 회원수" value={stats.totalUsers} />
        <StatCard title="관리자(Admin)" value={stats.adminCount} />
        <StatCard title="스태프(Support)" value={stats.supportCount} />
        <StatCard title="일반회원(Member)" value={stats.memberCount} />
        <StatCard title="소셜 로그인" value={stats.socialCount} />
        <StatCard title="일반 로그인" value={stats.localCount} />
        <StatCard title="탈퇴(추정)" value={stats.deletedCount} />
        <StatCard title="총 강의수" value={stats.totalCourses} />
      </div>

      {/* 최근 목록 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">최근 등록 회원</h2>
            <span className="text-sm text-gray-500">상위 5명</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">ID</th>
                <th className="py-2">이름</th>
                <th className="py-2">이메일</th>
                <th className="py-2">역할</th>
                <th className="py-2">소셜</th>
              </tr>
            </thead>
            <tbody>
              {stats.latestUsers.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="py-2">{u.id}</td>
                  <td className="py-2">{u.name}</td>
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">
                    {Array.isArray(u.roles) ? u.roles.join(", ") : "-"}
                  </td>
                  <td className="py-2">
                    <Badge ok={!!u.social} />
                  </td>
                </tr>
              ))}
              {stats.latestUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">최근 강의</h2>
            <span className="text-sm text-gray-500">상위 5개</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">ID</th>
                <th className="py-2">제목</th>
                <th className="py-2">가격</th>
                <th className="py-2">발행</th>
              </tr>
            </thead>
            <tbody>
              {stats.latestCourses.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="py-2">{c.id}</td>
                  <td className="py-2">{c.title}</td>
                  <td className="py-2">₩ {krw(c.price)}</td>
                  <td className="py-2">
                    <Badge ok={!!c.published} />
                  </td>
                </tr>
              ))}
              {stats.latestCourses.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function Pill({ title, value }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
      <span className="text-sm text-gray-600">{title}</span>
      <span className="text-base font-semibold">{value}</span>
    </div>
  );
}

function Badge({ ok }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs border " +
        (ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-gray-200 bg-gray-50 text-gray-500")
      }
    >
      {ok ? "Y" : "N"}
    </span>
  );
}
