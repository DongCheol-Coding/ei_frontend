import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStompChat } from "../../lib/useStompChat";
import { useSelector } from "react-redux";

// API BASE (절대 URL 권장)
const API_BASE = (import.meta.env.VITE_API_SERVER_HOST || "/api").replace(
  /\/$/,
  ""
);

// SockJS는 https:// 또는 http:// 만 허용(내부에서 ws/wss 업그레이드 처리)
const SOCK_URL = `${API_BASE}/api/ws-chat-sockjs`;

/* -----------------------------------------------------------
 * [추가] 한 줄에 허용할 "문자 수" 기준 (영문 1ch, 한글은 보통 2ch)
 * - 예) 한글 16자 기준이면 대략 32ch 권장
 * --------------------------------------------------------- */
const CHARS_PER_LINE = 32;

export default function SupportChatRoomPage() {
  const navigate = useNavigate();
  const { roomId: roomIdParam } = useParams();
  const roomId = Number(roomIdParam);

  // 현재 로그인 사용자 식별(id/email)
  const meId = useSelector((s) => s.auth?.user?.id);
  const meEmail = useSelector((s) => s.auth?.user?.email);

  // 직접 연결: 두 번째 인자로 SockJS 절대 URL(https://...) 전달
  const { connected, inbox, loading, send, error } = useStompChat(
    roomId,
    SOCK_URL
  );

  const [text, setText] = useState("");
  const listRef = useRef(null);

  // 메시지 렌더용: 날짜/보낸이 정보 정규화(+ isMine)
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

  // 하단 자동 스크롤
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    send(t);
    setText("");
  };

  // 로딩/에러/빈방 처리
  if (Number.isNaN(roomId)) {
    return (
      <div className="p-4">
        <div className="text-sm text-red-600">잘못된 방 번호입니다.</div>
        <button
          className="mt-3 px-3 py-1 border rounded"
          onClick={() => navigate(-1)}
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="border rounded-lg bg-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
            onClick={() => navigate("/admin/chat")}
            aria-label="목록으로"
          >
            ← 목록
          </button>
          <div className="text-sm font-semibold">방 #{roomId}</div>
        </div>
        <div className="text-xs">
          <span className={connected ? "text-green-600" : "text-gray-400"}>
            {connected ? "● 실시간 연결됨" : "○ 연결 대기"}
          </span>
        </div>
      </div>

      {/* 메시지 리스트 */}
      <div className="border rounded-lg bg-white h-[65vh] flex flex-col">
        <div className="px-3 py-2 text-sm border-b">대화</div>

        {loading && (
          <div className="p-4 text-sm text-gray-500">
            히스토리를 불러오는 중...
          </div>
        )}
        {!loading && error && (
          <div className="p-4 text-sm text-red-600">{error}</div>
        )}

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-3 py-2 space-y-3"
        >
          {messages.length === 0 && !loading && !error && (
            <div className="text-sm text-gray-500">메시지가 없습니다.</div>
          )}

          {/* -----------------------------------------------------------
             [수정] 말풍선: 폭을 글자 수 기준으로 제한 + 강제 줄바꿈
             - inline-block + w-fit : 설정한 폭(Nch) 이내면 1줄 유지
             - maxWidth: `${CHARS_PER_LINE}ch` : 초과 시 자동 줄바꿈
             - whitespace-pre-wrap + break-words : 긴 단어/URL도 줄바꿈
             --------------------------------------------------------- */}
          {messages.map((m) => {
            const bubble =
              "inline-block w-fit px-3 py-2 rounded-2xl whitespace-pre-wrap break-words text-sm";
            const mineBubble = "bg-indigo-600 text-white rounded-br-sm"; // 내 말풍선(오른쪽)
            const otherBubble = "bg-gray-100 text-gray-900 rounded-bl-sm"; // 상대 말풍선(왼쪽)

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
                    className={`${bubble} ${
                      m.isMine ? mineBubble : otherBubble
                    }`}
                    style={{ maxWidth: `${CHARS_PER_LINE}ch` }}
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
        </div>

        {/* 입력창 */}
        <form onSubmit={handleSubmit} className="border-t px-3 py-2 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="flex-1 border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            disabled={!connected || !text.trim()}
            className="px-4 py-2 rounded bg-indigo-600 text-white text-sm disabled:opacity-50"
          >
            보내기
          </button>
        </form>
      </div>
    </div>
  );
}
