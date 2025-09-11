import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useStompChat } from "../../lib/useStompChat.js";
import supportImg from "../../assets/chat/support.png";

const CHARS_PER_LINE = 32;

export default function ChatBody({ roomId }) {
  const { connected, inbox, loading, send } = useStompChat(roomId);

  // [추가됨] 현재 로그인 유저의 프로필 이미지 URL 확보 (없으면 "")
  const user = useSelector((s) => s.auth?.user);
  const myAvatarUrl = user?.imageUrl ?? "";

  const meId = useSelector((s) => s.auth?.user?.id);
  const meEmail = useSelector((s) => s.auth?.user?.email);

  const [text, setText] = useState("");
  const endRef = useRef(null);
  const composingRef = useRef(false);

  // [추가됨] 서버가 문자열만 중계해도 동작하도록, 문자열/JSON 모두 처리
  const pickTextAndAvatar = (rawMessage) => {
    let bodyText = rawMessage ?? "";
    let avatarUrl = "";
    if (typeof bodyText === "string") {
      try {
        const parsed = JSON.parse(bodyText);
        if (parsed && typeof parsed === "object" && "message" in parsed) {
          bodyText = String(parsed.message ?? "");
          avatarUrl = typeof parsed.imageUrl === "string" ? parsed.imageUrl : "";
        }
      } catch (_) {
        // 그냥 일반 텍스트였던 경우 그대로 사용
      }
    }
    return { bodyText, avatarUrl };
  };

  const messages = useMemo(() => {
    return (inbox ?? []).map((m) => {
      const senderId = m.senderUserId ?? m.senderId ?? null;
      const senderEmail = m.senderEmail ?? null;
      const isMine =
        (meId != null && String(senderId) === String(meId)) ||
        (meEmail &&
          senderEmail &&
          String(senderEmail).toLowerCase() === String(meEmail).toLowerCase());

      const { bodyText, avatarUrl } = pickTextAndAvatar(m.message);

      return {
        id: m.id ?? `${m.sentAt ?? ""}-${Math.random()}`,
        message: bodyText,
        avatarUrl, // [추가됨] 상대 아바타 URL(없으면 "")
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
    send({ message: t, imageUrl: myAvatarUrl });
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

  const handleCompositionStart = () => { composingRef.current = true; };
  const handleCompositionEnd = () => { composingRef.current = false; };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-1 text-[12px] text-right text-gray-500 border-b">
        연결 상태:{" "}
        <b className={connected ? "text-green-600" : "text-gray-400"}>
          {connected ? "정상" : "연결 끊김"}
        </b>
        {loading && <span className="ml-2">· 기록 불러오는 중…</span>}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 text-sm bg-white" style={{ WebkitOverflowScrolling: "touch" }}>
        {messages.map((m) => {
          const bubble = "inline-block w-fit px-3 py-2 rounded-2xl whitespace-pre-wrap text-sm break-words";
          const mineBubble = "bg-indigo-600 text-white rounded-br-sm";
          const otherBubble = "bg-gray-100 text-gray-900 rounded-bl-sm";

          if (m.isMine) {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="flex flex-col items-end">
                  <div className={`${bubble} ${mineBubble}`} style={{ maxWidth: `${CHARS_PER_LINE}ch` }}>
                    {m.message}
                  </div>
                  <div className="mt-1 text-[10px] text-indigo-400 text-right">
                    {String(m.time).replace("T", " ").slice(0, 16)}
                  </div>
                </div>
              </div>
            );
          }

          // [수정됨] 상대 아바타: imageUrl이 비어있으면 noImage로 폴백
          return (
            <div key={m.id} className="flex justify-start">
              <div className="flex items-end gap-2">
                <img
                  src={m.avatarUrl || supportImg}
                  alt="상대 아바타"
                  className="w-7 h-7 rounded-full object-cover ring-[1.5px] ring-[#5b5cf0]/40 shadow"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = supportImg; }}
                />
                <div className="flex flex-col items-start">
                  <div className={`${bubble} ${otherBubble}`} style={{ maxWidth: `${CHARS_PER_LINE}ch` }}>
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

      <form onSubmit={handleSubmit} className="p-2 border-t flex items-end gap-2 bg-white">
        <textarea
          className="flex-1 h-11 border rounded px-3 py-2 outline-none overflow-auto resize-none text-[13px] placeholder:text-xs"
          placeholder="메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => { composingRef.current = true; }}
          onCompositionEnd={() => { composingRef.current = false; }}
          aria-label="메시지 입력"
        />
        <button type="submit" disabled={!connected || !text.trim()} className="h-11 px-4 border rounded disabled:opacity-50">
          전송
        </button>
      </form>
    </div>
  );
}
