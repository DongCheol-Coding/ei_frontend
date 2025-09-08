import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useStompChat } from "../../lib/useStompChat.js";

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
      <div className="px-3 py-1 text-[12px] text-gray-500 border-b">
        연결 상태:{" "}
        <b className={connected ? "text-green-600" : "text-gray-400"}>
          {connected ? "온라인" : "오프라인"}
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
            "inline-block max-w-[80%] px-3 py-2 rounded-2xl whitespace-pre-wrap text-sm break-words";
          const mineBubble = "bg-indigo-600 text-white rounded-br-sm";
          const otherBubble = "bg-gray-100 text-gray-900 rounded-bl-sm";

          return (
            <div
              key={m.id}
              className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex flex-col ${
                  m.isMine ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`${bubble} ${m.isMine ? mineBubble : otherBubble}`}
                >
                  {m.message}
                </div>
                <div
                  className={`mt-1 text-[10px] ${
                    m.isMine
                      ? "text-indigo-400 text-right"
                      : "text-gray-400 text-left"
                  }`}
                >
                  {String(m.time).replace("T", " ").slice(0, 16)}
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
