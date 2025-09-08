import { useState, useCallback } from "react";
import { openRoom } from "../../services/api/chatApi";
import ChatBody from "./ChatBody";

export default function FloatingChatWidget({
  supportEmail = "info@dongcheolcoding.life",
  title = "고객지원 채팅",
  introLine = "상담시간 평일 월~금(10시~19시)",
  zIndex = 70,
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("welcome"); // 'welcome' | 'chat'
  const [roomId, setRoomId] = useState(null);
  const [opening, setOpening] = useState(false);
  const [err, setErr] = useState("");

  const close = useCallback(() => {
    setOpen(false);
    setMode("welcome");
    setErr("");
  }, []);

  const handleStartChat = async () => {
    if (opening || roomId != null) {
      setMode("chat");
      return;
    }
    setOpening(true);
    setErr("");
    try {
      const id = await openRoom(supportEmail);
      setRoomId(id);
      setMode("chat");
    } catch {
      setErr("방 개설에 실패했습니다. (권한/이메일 확인)");
    } finally {
      setOpening(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="문의하기"
        className="fixed bottom-6 right-6 rounded-full bg-[#5b5cf0] text-white shadow-xl h-14 px-5 flex items-center gap-2 hover:scale-[1.04] active:scale-[0.98] transition-transform duration-150 focus:outline-none focus:ring-4 focus:ring-[#5b5cf0]/30"
        style={{ zIndex }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 5h16v9a2 2 0 0 1-2 2H9l-5 4V5z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="9" cy="9" r="1.5" fill="currentColor" />
          <circle cx="13" cy="9" r="1.5" fill="currentColor" />
          <circle cx="17" cy="9" r="1.5" fill="currentColor" />
        </svg>
        <span className="text-[14px] font-semibold">문의하기</span>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border w-[360px] sm:w-[420px] h-[560px] overflow-hidden flex flex-col transition-all duration-200"
      style={{ zIndex }}
      role="dialog"
      aria-label={title}
    >
      {/* 헤더 */}
      <div className="h-12 px-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#5b5cf0] text-white text-xs font-semibold">
            ?
          </span>
          <h2 className="text-[15px] font-bold">{title}</h2>
        </div>
        <button
          onClick={close}
          aria-label="닫기"
          className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>

      {/* 안내 바 */}
      <div className="px-3 py-2 text-[12px] text-gray-600 border-b bg-gray-50">
        {introLine}
      </div>

      {/* 본문 */}
      <div className="flex-1 min-h-0 flex flex-col">
        {err && (
          <div className="p-3 text-sm text-red-600 border-b bg-red-50">
            {err}
          </div>
        )}

        {mode === "welcome" && (
          <div className="flex-1 flex flex-col items-center justify-center text-sm text-gray-500 px-6 text-center">
            <p className="mb-2">
              궁금하신 점을 남겨주시면 상담원이 순차적으로 답변드립니다.
            </p>
            <p>대화하기를 누르면 채팅이 시작됩니다.</p>
          </div>
        )}

        {mode === "chat" && roomId == null && (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
            방을 준비 중…
          </div>
        )}

        {mode === "chat" && roomId != null && (
          <div className="flex-1 min-h-0">
            <ChatBody roomId={roomId} onClose={close} />
          </div>
        )}
      </div>

      {/* 하단 CTA: 환영 모드에서만 노출 */}
      {mode === "welcome" && (
        <div className="p-3 border-t bg-white">
          <button
            onClick={handleStartChat}
            disabled={opening}
            className="w-full h-11 rounded-lg bg-[#5b5cf0] text-white font-semibold disabled:opacity-60"
          >
            {opening ? "방 개설 중…" : "대화하기"}
          </button>
        </div>
      )}
    </div>
  );
}
