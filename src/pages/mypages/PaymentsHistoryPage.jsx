// src/pages/PaymentsHistoryPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useSelector } from "react-redux";
import { getMyPayments } from "../../services/api/myPageApi";

export default function PaymentsHistoryPage() {
  // 레이아웃에서 내려주는 초기값(있으면 초기에 표시)
  const { payments: initialPayments = [] } = useOutletContext() ?? {};
  const accessToken = useSelector((s) => s.auth?.accessToken) ?? null;

  const [rows, setRows] = useState(initialPayments);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const acRef = useRef(null);

  useEffect(() => {
    acRef.current?.abort?.();
    const ac = new AbortController();
    acRef.current = ac;

    setLoading(true);
    setErr(null);
    getMyPayments({ accessToken, signal: ac.signal })
      .then((list) => setRows(list))
      .catch((e) => setErr(e?.message || "결제 내역을 가져오지 못했습니다."))
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [accessToken]);

  const sortedRows = useMemo(() => {
    return [...(rows || [])].sort((a, b) => {
      const da = new Date(String(a?.paymentDate ?? "").replace(" ", "T"));
      const db = new Date(String(b?.paymentDate ?? "").replace(" ", "T"));
      return db - da;
    });
  }, [rows]);

  const fmtKrw = (n) =>
    n == null ? "-" : `${new Intl.NumberFormat("ko-KR").format(Number(n))}원`;
  const onlyDate = (s) =>
    typeof s === "string" && s.length >= 10 ? s.slice(0, 10) : "-";

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">결제 내역</h1>
        <p className="text-sm text-gray-500">결제한 내역을 확인할 수 있어요.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600">
              <th className="px-4 py-3 text-left w-[50%]">강의 제목</th>
              <th className="px-4 py-3 text-left w-[18%]">결제일</th>
              <th className="px-4 py-3 text-left w-[18%]">결제 금액</th>
              <th className="px-4 py-3 text-left w-[14%]">상태</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  불러오는 중…
                </td>
              </tr>
            )}

            {!loading && err && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-red-600">
                  {err}
                </td>
              </tr>
            )}

            {!loading && !err && sortedRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  결제내역이 없습니다.
                </td>
              </tr>
            )}

            {!loading &&
              !err &&
              sortedRows.map((p, idx) => (
                <tr key={`${p?.courseId ?? idx}-${idx}`} className="border-t">
                  <td className="px-4 py-4">
                    <div className="truncate">{p?.courseName || "-"}</div>
                  </td>
                  <td className="px-4 py-4">{onlyDate(p?.paymentDate)}</td>
                  <td className="px-4 py-4">{fmtKrw(p?.price)}</td>
                  {/* /api/payment/me 응답에 상태 필드가 없으므로 표시는 고정 */}
                  <td className="px-4 py-4">결제 완료</td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="px-4 py-3 text-xs text-gray-500 border-t">
          *환불 신청은 문의하기를 통해 진행해주세요.
        </div>
      </div>
    </div>
  );
}
