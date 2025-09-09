// src/lib/useStompChat.js
/*
[변경 요약]
- SockJS XHR 폴백에 withCredentials 적용(교차도메인 쿠키 보장)
- publish 본문에 message/content/text 모두 포함(서버 DTO 불일치 방지)
- STOMP ERROR/RECEIPT/UNHANDLED 로깅 강화(문제 원인 즉시 식별)
- 구독: /topic/chat/{id}, /user/queue/chat/{id} (백엔드 설정과 일치)
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

        // 수정됨: XHR 폴백에서도 쿠키 전송 보장
        const webSocketFactory = () =>
          new SockJS(sockUrl, null, {
            transportOptions: {
              xhrStream: { withCredentials: true },
              xhrPolling: { withCredentials: true },
            },
          });

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
                } catch (e) {
                  console.warn("[useStompChat] parse error:", e, frame.body);
                }
              })
            );
          },
          onStompError: (frame) => {
            setConnected(false);
            console.error(
              "[useStompChat] STOMP ERROR:",
              frame.headers?.message,
              frame.body
            );
            setError(frame.headers?.message || "STOMP 오류");
          },
          onWebSocketError: (e) => {
            setConnected(false);
            console.error("[useStompChat] WS ERROR:", e);
          },
          onWebSocketClose: () => setConnected(false),
          debug: () => {},
        });

        // receipt/미처리/미구독 디버그
        c.onUnhandledMessage = (m) =>
          console.warn("[useStompChat] unhandled MESSAGE:", m);
        c.onUnhandledReceipt = (r) =>
          console.warn("[useStompChat] unhandled RECEIPT:", r);
        c.onUnhandledFrame = (f) =>
          console.warn("[useStompChat] unhandled FRAME:", f);
        c.onReceipt = (frame) => {
          // console.debug("RECEIPT:", frame.headers["receipt-id"]);
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
      const t = text?.trim();
      if (!t) return;

      try {
        const dest = `${APP_PREFIX}/chat/${roomId}`; // 백엔드 setApplicationDestinationPrefixes("/app")와 일치
        const body = {
          // 수정됨: 서버 DTO 불일치 대비
          message: t,
          content: t,
          text: t,
          roomId,
        };

        const receiptId = `send-${roomId}-${Date.now()}`;
        const to = setTimeout(() => {
          console.warn(
            "[useStompChat] NO RECEIPT (핸들러/경로 확인 필요):",
            dest
          );
        }, 5000);

        const prevOnReceipt = clientRef.current?.onReceipt;
        clientRef.current.onReceipt = (frame) => {
          if (frame.headers["receipt-id"] === receiptId) clearTimeout(to);
          prevOnReceipt?.(frame);
        };

        clientRef.current?.publish({
          destination: dest,
          body: JSON.stringify(body),
          headers: {
            "content-type": "application/json;charset=UTF-8",
            receipt: receiptId,
          },
        });
      } catch (e) {
        console.warn("[useStompChat] send error:", e);
      }
    },
    [roomId]
  );

  return { connected, inbox, loading, send, error };
}
