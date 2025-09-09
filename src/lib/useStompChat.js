// src/lib/useStompChat.js
/*
[변경 요약]
- 두 번째 인자 sockUrlOrBase를 받아 SockJS용 절대 URL을 생성
- ws://, wss://가 들어와도 http/https로 자동 치환하여 SecurityError 방지
- 디버그 로그로 실제 SockJS 연결 URL 출력
*/
import { useEffect, useRef, useState, useCallback } from "react";
import { getMessages } from "../services/api/chatApi";

const API_BASE = (import.meta.env.VITE_API_SERVER_HOST || "/api").replace(
  /\/$/,
  ""
);

export function useStompChat(roomId, sockUrlOrBase) {
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 히스토리 로딩(REST)
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
    if (roomId == null) return;
    loadHistory();
  }, [roomId, loadHistory]);

  useEffect(() => {
    if (roomId == null) return;
    let alive = true;

    (async () => {
      try {
        const [{ Client }, SockJSMod] = await Promise.all([
          import("@stomp/stompjs"),
          import("sockjs-client"),
        ]);
        if (!alive) return;

        const SockJS = SockJSMod.default || SockJSMod;

        // --- 수정됨: SockJS가 요구하는 http/https URL로 강제 ---
        const raw = sockUrlOrBase || `${API_BASE}/api/ws-chat-sockjs`; // 기본값(절대 URL 권장)

        // ws/wss가 들어오면 http/https로 치환
        const sockUrl = raw
          .replace(/^ws:\/\//i, "http://")
          .replace(/^wss:\/\//i, "https://");

        console.debug("[useStompChat] SockJS URL =", sockUrl);

        const webSocketFactory = () => new SockJS(sockUrl);

        const c = new Client({
          webSocketFactory,
          reconnectDelay: 3000,
          // heartbeatIncoming: 10000,
          // heartbeatOutgoing: 10000,
          onConnect: () => {
            if (!alive) return;
            setConnected(true);
            try {
              // 구독 경로는 서버 설정과 동일하게
              subRef.current = c.subscribe(
                `/topic/chat/${roomId}`, // 필요 시 /user/queue/... 등으로 교체
                (frame) => {
                  try {
                    const msg = JSON.parse(frame.body);
                    setInbox((prev) => [...prev, msg]);
                  } catch {}
                }
              );
            } catch {}
          },
          onStompError: () => setConnected(false),
          onWebSocketError: () => setConnected(false),
          onWebSocketClose: () => setConnected(false),
          debug: () => {},
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

  const send = useCallback(
    (text) => {
      try {
        clientRef.current?.publish({
          destination: `/app/chat/${roomId}`, // 서버 매핑에 맞춰 조정
          body: JSON.stringify({ message: text }),
        });
      } catch {}
    },
    [roomId]
  );

  return { connected, inbox, loading, send, error };
}
