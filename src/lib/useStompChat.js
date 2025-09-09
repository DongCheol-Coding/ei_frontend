// src/lib/useStompChat.js
/*
[수정됨: 동일 출처 우회 경로(wss) 기본화]
- API_BASE 기본값을 빈 문자열("")로 변경 → 환경변수 없으면 상대경로 사용
- SOCK_URL을 상대경로 "/api/ws-chat-sockjs"로 계산 (프록시 경유)
- ws(s) → http(s) 변환 로직 유지(SockJS 규약), XHR 폴백 withCredentials 유지
- 서버 계약: SEND → `${APP_PREFIX}/chat.send`, SUBSCRIBE → `/user/queue/messages`
- REST 히스토리 로딩 유지
*/
import { useEffect, useRef, useState, useCallback } from "react";
import { getMessages } from "../services/api/chatApi";

// 환경변수 없으면 "" 로 두어 상대경로 사용(= 프록시 우회)
const API_BASE = (import.meta.env.VITE_API_SERVER_HOST || "").replace(
  /\/$/,
  ""
);
const SOCK_PATH = "/api/ws-chat-sockjs";
const SOCK_URL = API_BASE ? `${API_BASE}${SOCK_PATH}` : SOCK_PATH;

const APP_PREFIX = (import.meta.env.VITE_STOMP_APP_PREFIX || "/app").replace(
  /\/$/,
  ""
);

export function useStompChat(roomId, sockUrlOrBase = SOCK_URL) {
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1) 히스토리 로딩 (REST)
  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getMessages(roomId);
      setInbox(list);
    } catch (e) {
      console.warn("[useStompChat] history error:", e);
      setInbox([]);
      setError("메시지 기록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (roomId == null || Number.isNaN(roomId)) return;
    loadHistory();
  }, [roomId, loadHistory]);

  // 2) SockJS + STOMP 연결
  useEffect(() => {
    if (roomId == null || Number.isNaN(roomId)) return;
    let alive = true;

    (async () => {
      try {
        const [{ Client }, SockJSMod] = await Promise.all([
          import("@stomp/stompjs"),
          import("sockjs-client"),
        ]);
        if (!alive) return;

        const SockJS = SockJSMod.default || SockJSMod;

        // SockJS는 base가 ws(s)면 http(s)로 맞춰야 합니다.
        const sockUrl = sockUrlOrBase
          .replace(/^ws:\/\//i, "http://")
          .replace(/^wss:\/\//i, "https://");

        const webSocketFactory = () =>
          new SockJS(sockUrl, null, {
            // 교차도메인/XHR 폴백에서도 쿠키 포함
            transportOptions: {
              xhrStream: { withCredentials: true },
              xhrPolling: { withCredentials: true },
            },
            transports: ["websocket", "xhr-streaming", "xhr-polling"],
          });

        const c = new Client({
          webSocketFactory,
          reconnectDelay: 3000,
          debug: () => {},
          onConnect: () => {
            if (!alive) return;
            setConnected(true);

            // 서버가 convertAndSendToUser(..., "/queue/messages", ...)로 발행
            subRef.current = c.subscribe("/user/queue/messages", (frame) => {
              try {
                const msg = JSON.parse(frame.body);
                if (Number(msg?.chatRoomId) === Number(roomId)) {
                  setInbox((prev) => [...prev, msg]);
                }
              } catch (e) {
                console.warn("[useStompChat] invalid message body:", e);
              }
            });
          },
          onStompError: (f) => {
            setConnected(false);
            console.error(
              "[useStompChat] STOMP ERROR:",
              f.headers?.message,
              f.body
            );
            setError(f.headers?.message || "STOMP 오류");
          },
          onWebSocketError: (e) => {
            setConnected(false);
            console.error("[useStompChat] WS ERROR:", e);
          },
          onWebSocketClose: () => setConnected(false),
        });

        c.activate();
        clientRef.current = c;
      } catch (e) {
        console.warn("[useStompChat] activate error:", e);
        setConnected(false);
      }
    })();

    return () => {
      alive = false;
      try {
        subRef.current?.unsubscribe();
      } catch {}
      try {
        clientRef.current?.deactivate();
      } catch {}
      setConnected(false);
    };
  }, [roomId, sockUrlOrBase]);

  // 3) 전송 (@MessageMapping("chat.send")에 맞춤)
  const send = useCallback(
    (text) => {
      const t = String(text ?? "").trim();
      if (!t) return;
      const c = clientRef.current;
      if (!c) return;

      const body = JSON.stringify({ chatRoomId: roomId, message: t });
      c.publish({
        destination: `${APP_PREFIX}/chat.send`,
        body,
        headers: { "content-type": "application/json;charset=UTF-8" },
      });
    },
    [roomId]
  );

  return { connected, inbox, loading, send, error };
}

export default useStompChat;
