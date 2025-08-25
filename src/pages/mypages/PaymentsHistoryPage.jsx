// src/pages/PaymentsHistoryPage.jsx
import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";

export default function PaymentsHistoryPage() {
  const { payments = [] } = useOutletContext() ?? {};

  const sortedRows = useMemo(() => {
    return [...(payments || [])].sort((a, b) => {
      const da = new Date(String(a?.paymentDate ?? "").replace(" ", "T"));
      const db = new Date(String(b?.paymentDate ?? "").replace(" ", "T"));
      return db - da;
    });
  }, [payments]);

  const fmtKrw = (n) =>
    n == null ? "-" : `${new Intl.NumberFormat("ko-KR").format(Number(n))}만원`;
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
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  결제내역이 없습니다.
                </td>
              </tr>
            )}

            {sortedRows.map((p, idx) => {
              const key =
                p?.courseId != null && p?.paymentDate
                  ? `${p.courseId}-${p.paymentDate}`
                  : `row-${idx}`;
              return (
                <tr key={key} className="border-t">
                  <td className="px-4 py-4">
                    <div className="truncate">{p?.courseName || "-"}</div>
                  </td>
                  <td className="px-4 py-4">{onlyDate(p?.paymentDate)}</td>
                  <td className="px-4 py-4">{fmtKrw(p?.price)}</td>
                  {/* 상태 필드가 없으므로 고정 표기 */}
                  <td className="px-4 py-4">결제 완료</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="px-4 py-3 text-xs text-gray-500 border-t">
          *환불 신청은 문의하기를 통해 진행해주세요.
        </div>
      </div>
    </div>
  );
}
