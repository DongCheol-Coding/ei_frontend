// src/lib/useStompChat.js
/*
[변경 요약]
- publish 시 content-type, receipt 헤더 추가(서버 수신 확인)
- 발행 경로를 APP_PREFIX(기본 '/app')로 구성 → 서버 setApplicationDestinationPrefixes와 일치
- 구독 경로를 /topic/chat/{id}, /user/queue/chat/{id} 동시 구독(브로드캐스트/개인큐 대응)
- receipt 타임아웃(예: 5s)으로 서버 미처리 탐지
*/
import { useEffect, useRef, useState, useCallback } from "react";
import { getMessages } from "../services/api/chatApi";

const API_BASE = (import.meta.env.VITE_API_SERVER_HOST || "/api").replace(
  /\/$/,
  ""
);
const APP_PREFIX = (import.meta.env.VITE_STOMP_APP_PREFIX || "/app").replace(
  /\/$/,
  ""
);

export function useStompChat(roomId, sockUrlOrBase) {
  const clientRef = useRef(null);
  const subRefs = useRef([]);
  const [connected, setConnected] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        const raw = sockUrlOrBase || `${API_BASE}/api/ws-chat-sockjs`;
        const sockUrl = raw
          .replace(/^ws:\/\//i, "http://")
          .replace(/^wss:\/\//i, "https://");
        const webSocketFactory = () => new SockJS(sockUrl);

        const c = new Client({
          webSocketFactory,
          reconnectDelay: 3000,
          onConnect: () => {
            if (!alive) return;
            setConnected(true);

            const paths = [
              `/topic/chat/${roomId}`,
              `/user/queue/chat/${roomId}`,
            ];
            subRefs.current = paths.map((p) =>
              c.subscribe(p, (frame) => {
                try {
                  const msg = JSON.parse(frame.body);
                  setInbox((prev) => [...prev, msg]);
                } catch {}
              })
            );
          },
          onStompError: () => setConnected(false),
          onWebSocketError: () => setConnected(false),
          onWebSocketClose: () => setConnected(false),
          debug: () => {},
        });

        c.onReceipt = (frame) => {
          // 서버가 처리한 publish에 대해 영수증 도착
          // console.debug("Receipt OK:", frame.headers["receipt-id"]);
        };

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
        subRefs.current.forEach((s) => s?.unsubscribe?.());
      } catch {}
      subRefs.current = [];
      try {
        clientRef.current?.deactivate();
      } catch {}
      setConnected(false);
    };
  }, [roomId, sockUrlOrBase]);

  const send = useCallback(
    (text) => {
      const body = { message: text, roomId }; // roomId 포함(서버 DTO에 따라 무시 가능)

      try {
        const receiptId = `send-${roomId}-${Date.now()}`;
        const dest = `${APP_PREFIX}/chat/${roomId}`; // 서버 @MessageMapping("/chat/{roomId}")와 일치해야 함

        // 5초 내 receipt 없으면 경고(서버에서 라우팅/핸들러 미구현 가능성)
        const t = setTimeout(() => {
          console.warn("[useStompChat] no receipt from server:", receiptId);
          // 필요시 사용자에게 표시:
          // setError("메시지가 서버에 전달되지 않았습니다. (@MessageMapping 경로 확인 필요)");
        }, 5000);

        clientRef.current?.publish({
          destination: dest,
          body: JSON.stringify(body),
          headers: {
            "content-type": "application/json;charset=UTF-8",
            receipt: receiptId,
          },
        });

        // receipt 도착 시 타이머 해제
        const origOnReceipt = clientRef.current?.onReceipt;
        clientRef.current.onReceipt = (frame) => {
          if (frame.headers["receipt-id"] === receiptId) clearTimeout(t);
          origOnReceipt?.(frame);
        };
      } catch (e) {
        console.warn("[useStompChat] send error:", e);
      }
    },
    [roomId]
  );

  return { connected, inbox, loading, send, error };
}
