import { useEffect, useMemo, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import SideBar from "../components/mypage/SideBar";
import { getMyPage } from "../services/api/myPageApi";

export default function MyPageLayout() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useSelector((s) => s.auth?.user);
  const roles = user?.roles ?? [];

  const admin =
    Array.isArray(roles) &&
    roles
      .map((r) => String(r).toUpperCase().trim())
      .some((r) => r === "ROLE_ADMIN" || r === "ROLE_SUPPORT");

  useEffect(() => {
    if (admin) return;

    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await getMyPage({ signal: ac.signal });
        setData({
          user: res?.user ?? null,
          payments: Array.isArray(res?.payments) ? res.payments : [],
          coursesProgress: Array.isArray(res?.coursesProgress)
            ? res.coursesProgress
            : [],
        });
      } catch (e) {
        if (e.name === "CanceledError" || e.code === "ERR_CANCELED") return;
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const latestPaidCourseId = useMemo(() => {
    const payments = Array.isArray(data?.payments) ? data.payments : [];
    if (!payments.length) return null;

    const latest = payments.slice().sort((a, b) => {
      const da = new Date(a?.paymentDate ?? 0).getTime();
      const db = new Date(b?.paymentDate ?? 0).getTime();
      return db - da;
    })[0];

    const cid = Number(latest?.courseId);
    return Number.isFinite(cid) ? cid : null;
  }, [data?.payments]);

  if (admin) {
    return <Navigate to="/admin" replace />;
  }

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-98px)] bg-gray-50 p-20 grid place-items-center">
        불러오는 중…
      </div>
    );
  }
  if (!data?.user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full min-h-[calc(100vh-98px)] bg-gray-50 p-10 pb-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-[16rem_1fr] gap-6">
          <SideBar />
          <main className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 px-5 py-6">
              <div className="text-[25px] text-indigo-700 font-semibold text-center">
                "언젠가 이 모든 것을 이겨냈다는게 자랑스러워질 거예요."
              </div>
            </div>

            {/* 페이지 내용 */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <Outlet
                context={{
                  user: data.user,
                  payments: data.payments,
                  coursesProgress: data.coursesProgress,
                  latestPaidCourseId,
                }}
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
