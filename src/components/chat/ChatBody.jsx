import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useStompChat } from "../../lib/useStompChat.js";
import supportImg from "../../assets/chat/support.png";

/* 한 줄 허용 문자 수(영문 1ch, 한글은 보통 2ch 정도 폭)
   예) 한글 16자 기준이면 대략 32ch 권장 */
const CHARS_PER_LINE = 32;

export default function ChatBody({ roomId }) {
  const { connected, inbox, loading, send } = useStompChat(roomId);

  const meId = useSelector((s) => s.auth?.user?.id);
  const meEmail = useSelector((s) => s.auth?.user?.email);

  const [text, setText] = useState("");
  const endRef = useRef(null);
  const composingRef = useRef(false);

  const messages = useMemo(() => {
    return (inbox ?? []).map((m) => {
      const senderId = m.senderUserId ?? m.senderId ?? null;
      const senderEmail = m.senderEmail ?? null;
      const isMine =
        (meId != null && String(senderId) === String(meId)) ||
        (meEmail &&
          senderEmail &&
          String(senderEmail).toLowerCase() === String(meEmail).toLowerCase());

      return {
        id: m.id ?? `${m.sentAt ?? ""}-${Math.random()}`,
        message: m.message ?? "",
        time: (m.sentAt ?? m.createdAt ?? "").toString(),
        isMine,
      };
    });
  }, [inbox, meId, meEmail]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  const doSend = () => {
    const t = text.trim();
    if (!t || !connected) return;
    send(t);
    setText("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doSend();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing || composingRef.current) return;
      e.preventDefault();
      doSend();
    }
  };

  const handleCompositionStart = () => {
    composingRef.current = true;
  };
  const handleCompositionEnd = () => {
    composingRef.current = false;
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 상단 상태 바 */}
      <div className="px-3 py-1 text-[12px] text-right text-gray-500 border-b">
        연결 상태:{" "}
        <b className={connected ? "text-green-600" : "text-gray-400"}>
          {connected ? "정상" : "연결 끊김"}
        </b>
        {loading && <span className="ml-2">· 기록 불러오는 중…</span>}
      </div>

      {/* 메시지 리스트 */}
      <div
        className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 text-sm bg-white"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {messages.map((m) => {
          const bubble =
            "inline-block w-fit px-3 py-2 rounded-2xl whitespace-pre-wrap text-sm break-words";
          const mineBubble = "bg-indigo-600 text-white rounded-br-sm";
          const otherBubble = "bg-gray-100 text-gray-900 rounded-bl-sm";

          if (m.isMine) {
            // 내 메시지(오른쪽 정렬, 기존과 동일)
            return (
              <div key={m.id} className="flex justify-end">
                <div className="flex flex-col items-end">
                  <div
                    className={`${bubble} ${mineBubble}`}
                    style={{ maxWidth: `${CHARS_PER_LINE}ch` }}
                  >
                    {m.message}
                  </div>
                  <div className="mt-1 text-[10px] text-indigo-400 text-right">
                    {String(m.time).replace("T", " ").slice(0, 16)}
                  </div>
                </div>
              </div>
            );
          }

          // 상대 메시지(왼쪽): 아바타 + 말풍선 (ChatBody 스타일 유지)
          return (
            <div key={m.id} className="flex justify-start">
              <div className="flex items-end gap-2">
                {/* 아바타 */}
                <img
                  src={supportImg}
                  alt="상대 아바타"
                  className="w-7 h-7 rounded-full object-cover ring-[1.5px] ring-[#5b5cf0]/40 shadow"
                  loading="lazy"
                />
                {/* 말풍선 + 타임스탬프 */}
                <div className="flex flex-col items-start">
                  <div
                    className={`${bubble} ${otherBubble}`}
                    style={{ maxWidth: `${CHARS_PER_LINE}ch` }}
                  >
                    {m.message}
                  </div>
                  <div className="mt-1 text-[10px] text-gray-400 text-left">
                    {String(m.time).replace("T", " ").slice(0, 16)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* 하단 입력/버튼 */}
      <form
        onSubmit={handleSubmit}
        className="p-2 border-t flex items-end gap-2 bg-white"
      >
        <textarea
          className="flex-1 h-11 border rounded px-3 py-2 outline-none overflow-auto resize-none text-[13px] placeholder:text-xs"
          placeholder="메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          aria-label="메시지 입력"
        />
        <button
          type="submit"
          disabled={!connected || !text.trim()}
          className="h-11 px-4 border rounded disabled:opacity-50"
        >
          전송
        </button>
      </form>
    </div>
  );
}
