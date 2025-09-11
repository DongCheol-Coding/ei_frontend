// src/lib/useStompChat.js
/*
[수정 요약]
1) send: 문자열/객체 모두 허용하되, 항상 JSON.stringify로 직렬화해 전송
2) onMessage: 서버에서 온 본문은 'raw 문자열' 그대로 rec.message에 저장
   - 단, JSON이면 senderUserId/senderEmail/sentAt 등 메타만 추출해 같이 보관
3) history 로드(getMessages)는 기존 형태 유지
*/

import { useEffect, useRef, useState, useCallback } from "react";
import { getMessages } from "../services/api/chatApi";

export function useStompChat(roomId, sockUrl) {
  const clientRef = useRef(null);
  const subRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 히스토리 로딩 (REST)
  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getMessages(roomId);
      setInbox(Array.isArray(list) ? list : []);
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

  // SockJS + STOMP 연결
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
        const webSocketFactory = () =>
          new SockJS(sockUrl || "/api/ws-chat-sockjs");

        const c = new Client({
          webSocketFactory,
          reconnectDelay: 3000,
          onConnect: () => {
            if (!alive) return;
            setConnected(true);

            // 구독 경로는 프로젝트에 맞게 유지/조정하세요
            subRef.current = c.subscribe("/user/queue/messages", (frame) => {
              const raw = frame.body ?? "";
              let meta = null;
              try {
                meta = JSON.parse(raw);
              } catch (_) {
                // 본문이 순수 텍스트면 meta는 null
              }

              const rec = {
                id: meta?.id ?? `${Date.now()}-${Math.random()}`,
                // message는 '항상 문자열'로 유지 (UI에서 필요 시 JSON 파싱)
                message: typeof raw === "string" ? raw : String(raw),
                senderUserId: meta?.senderUserId ?? meta?.senderId ?? null,
                senderEmail: meta?.senderEmail ?? null,
                sentAt: meta?.sentAt ?? null,
                createdAt: meta?.createdAt ?? null,
              };

              setInbox((prev) => [...prev, rec]);
            });
          },
          onStompError: (f) => {
            console.warn("[useStompChat] broker error", f?.headers, f?.body);
            setError("브로커 오류가 발생했습니다.");
          },
          onWebSocketError: (e) => {
            console.warn("[useStompChat] transport error", e);
            setError("네트워크 오류가 발생했습니다.");
          },
          onDisconnect: () => {
            setConnected(false);
          },
        });

        clientRef.current = c;
        c.activate();
      } catch (e) {
        console.warn("[useStompChat] connect error:", e);
        setError("연결에 실패했습니다.");
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
  }, [roomId, sockUrl]);

  // 메시지 전송
  const send = useCallback(
    (input) => {
      const c = clientRef.current;
      if (!c || !connected) return;

      // 문자열/객체 모두 허용, 항상 직렬화
      const payload =
        typeof input === "string"
          ? { message: input, imageUrl: "" }
          : {
              message: String(input?.message ?? ""),
              imageUrl: String(input?.imageUrl ?? ""),
            };

      const body = JSON.stringify(payload);

      c.publish({
        destination: `/app/chat/${roomId}`, // 서버 매핑에 맞게 유지
        body,
      });
    },
    [connected, roomId]
  );

  return { connected, inbox, loading, error, send };
}
