// src/pages/common/LoadingPage.jsx
import { useEffect, useRef, useState } from "react";

export default function LoadingPage({
  title = "처리 중",
  done = false, // 외부에서 완료 신호 전달 (true가 되면 100%로 마무리)
  error = "", // 에러 메시지 전달 시 빨간 안내 + 이동 버튼 노출
  tips = [
    "팁: 새로고침하지 말고 잠시만 기다려 주세요.",
    "팁: 브라우저 확장프로그램이 간섭할 수 있어요.",
    "팁: 진행 중 창을 닫지 않는 것이 좋아요.",
  ],
  afterDoneDelay = 500, // 완료 후 onDone 호출까지 딜레이(ms)
  onDone, // 완료 후 실행할 콜백 (옵션)
}) {
  const [progress, setProgress] = useState(12);
  const [status, setStatus] = useState("요청 확인 중...");
  const doneRef = useRef(false);

  // 외부에서 done=true가 들어오면 즉시 마무리
  useEffect(() => {
    if (done && !doneRef.current) {
      doneRef.current = true;
      setProgress(100);
      setStatus("완료되었습니다. 이동 준비 중...");
      if (typeof onDone === "function") {
        const id = setTimeout(() => onDone(), afterDoneDelay);
        return () => clearTimeout(id);
      }
    }
  }, [done, onDone, afterDoneDelay]);

  // 진행률/상태를 부드럽게 갱신(최대 95%까지만 자동)
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        if (doneRef.current || done) return p;
        const next = Math.min(p + Math.max(1, Math.round((95 - p) * 0.08)), 95);

        if (next < 30) setStatus("요청 확인 중...");
        else if (next < 65) setStatus("데이터 처리 및 동기화 중...");
        else setStatus("마무리 중...");

        return next;
      });
    }, 200);
    return () => clearInterval(id);
  }, [done]);

  // 3초마다 회전하는 팁
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);
  const tip = tips[tick % tips.length];

  return (
    <div className="min-h-[calc(100vh-98px)] grid place-items-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {/* 헤더 + 스피너 */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-gray-200 grid place-items-center">
            <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
          </div>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>

        {/* 상태 문구 (스크린리더 공지) */}
        <p className="mt-3 text-sm text-gray-600" aria-live="polite">
          {status}
        </p>

        {/* 진행 바 */}
        <div className="mt-4 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="처리 진행률"
          />
        </div>

        {/* 회전 팁 */}
        <div className="mt-3 text-xs text-gray-400">{tip}</div>

        {/* 에러 노출 + 즉시 이동 버튼 */}
        {error && (
          <div className="mt-4 text-sm text-red-600">
            {error}
            <div className="mt-2">
              <button
                onClick={() => {
                  if (window.history.length > 1) window.history.back();
                  else window.location.href = "/";
                }}
                className="px-3 py-1.5 text-xs border rounded-md"
              >
                이전 페이지로 이동
              </button>
            </div>
          </div>
        )}

        {/* 헬프 텍스트 */}
        <div className="mt-6 text-xs text-gray-400">
          문제가 계속되면 브라우저 쿠키/스토리지를 삭제한 뒤 다시 시도해 주세요.
        </div>
      </div>
    </div>
  );
}
