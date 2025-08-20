// src/pages/PaymentPage.jsx
import { useMemo, useState } from "react";
import kakaopayIcon from "../../assets/payment_icon_yellow_small.png";
import naverpayIcon from "../../assets/naver_pay_icon.svg";
import tosspayIcon from "../../assets/tosspay_icon.svg";
import { readyKakaoPay } from "../../services/api/kakaoPayApi";

/** 천 단위 콤마, 원화 표기 */
const krw = (n) => new Intl.NumberFormat("ko-KR").format(n);

export default function PaymentPage() {
  // --- 가짜 데이터(디자인용) ---
  const courseTitle = "[웹개발 취업] 1:1 관리형 부트캠프_2507_FULL_FULL STACK";
  const price = 2_590_000;
  const monthly = useMemo(() => Math.floor(price / 12), [price]);

  // --- UI 상태(디자인용) ---
  const [agree, setAgree] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [payMethod, setPayMethod] = useState(null); // 'kakaopay' | null
  const [loading, setLoading] = useState(false);

  // 약관 + 카카오페이 선택 시에만 활성화
  const canSubmit = agree && payMethod === "kakaopay";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      const redirectUrl = await readyKakaoPay(1); // <-- 고정된 코스 ID
      // 현재 탭에서 카카오 결제 페이지로 이동
      window.location.assign(redirectUrl);
    } catch (err) {
      alert(err?.message || "결제 준비 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* 헤더 */}
      <h1 className="text-3xl font-bold tracking-tight">수강 신청</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 좌측: 입력 영역 */}
        <section className="lg:col-span-2 space-y-8">
          {/* 강의 정보 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <label className="block text-xl font-semibold text-gray-800">
              강의 정보
            </label>
            <div className="mt-3">
              <input
                readOnly
                value={courseTitle}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 shadow-inner focus:outline-none"
              />
            </div>
          </div>

          {/* 추천인 코드 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <label className="block text-xl font-semibold text-gray-800">
              추천인 코드
            </label>
            <div className="mt-3 flex gap-3">
              <input
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                placeholder="추천인이 있는 경우에만 입력하세요."
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-gray-300 focus:outline-none"
              />
              <button
                type="button"
                className="h-[44px] rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white disabled:bg-gray-300"
                disabled
                title="디자인만 구현 (기능 없음)"
              >
                확인
              </button>
            </div>
            <p className="mt-2 text-sm text-red-500">
              * 추천인이 있는 경우에만 입력해주세요.
            </p>
          </div>

          {/* 결제 방법 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">
                결제 방법
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {/* 카카오페이 - 선택 가능 */}
              <button
                type="button"
                onClick={() =>
                  setPayMethod((m) => (m === "kakaopay" ? null : "kakaopay"))
                }
                aria-pressed={payMethod === "kakaopay"}
                className={[
                  "relative flex h-16 items-center justify-center rounded-xl border transition",
                  payMethod === "kakaopay"
                    ? "border-yellow-400 ring-2 ring-yellow-300/40"
                    : "border-gray-300 hover:border-gray-500",
                ].join(" ")}
                title="카카오페이"
              >
                <img
                  src={kakaopayIcon}
                  alt="카카오페이"
                  className="h-7 w-auto object-contain"
                />
              </button>

              {/* 네이버페이 - 비활성 */}
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="relative flex h-16 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                title="현재 미지원 결제수단"
              >
                <img
                  src={naverpayIcon}
                  alt="네이버페이"
                  className="h-6 w-auto object-contain opacity-50"
                />
              </button>

              {/* 토스페이 - 비활성 */}
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="relative flex h-16 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                title="현재 미지원 결제수단"
              >
                <img
                  src={tosspayIcon}
                  alt="토스페이"
                  className="h-5 w-auto object-contain opacity-50"
                />
              </button>

              {/* 신용/체크카드 - 비활성 */}
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="relative flex h-16 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                title="현재 미지원 결제수단"
              >
                신용·체크카드
              </button>
            </div>
          </div>

          {/* 약관 동의 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded-md border-gray-300"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <div className="text-sm leading-6 text-gray-700">
                결제 서비스 이용 약관, 개인정보 처리 동의
              </div>
            </label>
          </div>
        </section>

        {/* 우측: 결제 요약 카드 */}
        <aside className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-lg font-bold">결제 정보</h2>

            <div className="mt-6 space-y-4">
              <Row label="상품 금액" value={`${krw(price)}원`} />
              <div className="h-px w-full bg-gray-200" />
              <Row
                label="최종 결제금액"
                valueClass="text-2xl font-extrabold text-gray-900"
                value={`${krw(price)}원`}
              />
              <Row
                label="12개월 할부 이용시"
                value={`${krw(monthly)}원`}
                hint
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className={[
                "mt-6 w-full rounded-xl px-5 py-3 text-center text-sm font-bold",
                canSubmit
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed",
              ].join(" ")}
              disabled={!canSubmit}
              title={
                canSubmit
                  ? "카카오 결제 페이지로 이동합니다."
                  : "카카오페이를 선택하고 약관에 동의하면 활성화됩니다."
              }
            >
              {loading ? "수강 신청 중..." : "수강신청하기"}
            </button>

            <p className="mt-3 text-xs leading-5 text-gray-500">
              상품 이용관련 유의사항을 모두 확인하였고, 이에 동의합니다.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** 요약행 컴포넌트 */
function Row({ label, value, valueClass = "", hint = false }) {
  return (
    <div className="flex items-end justify-between">
      <span
        className={[
          "text-sm font-medium text-gray-600",
          hint ? "text-gray-500" : "",
        ].join(" ")}
      >
        {label}
      </span>
      <span className={valueClass || "text-base font-semibold text-gray-900"}>
        {value}
      </span>
    </div>
  );
}
