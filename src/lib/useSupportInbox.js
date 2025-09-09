import { useEffect, useRef, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_SERVER_HOST || "/api").replace(
  /\/$/,
  ""
);
const DEFAULT_SOCK_URL = `${API_BASE}/api/ws-chat-sockjs`;

export default function useSupportInbox(wsBase) {
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState(new Map()); // roomId -> { lastMessage, lastTime }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ Client }, SockJSMod] = await Promise.all([
          import("@stomp/stompjs"),
          import("sockjs-client"),
        ]);
        if (!alive) return;

        const SockJS = SockJSMod.default || SockJSMod;
        // 수정됨: 절대 URL(직접 연결) 사용
        const base = wsBase || DEFAULT_SOCK_URL;
        const webSocketFactory = () => new SockJS(base);

        const c = new Client({
          webSocketFactory,
          reconnectDelay: 3000,
          // 필요 시 하트비트 활성화 (서버와 맞춰 쓰세요)
          // heartbeatIncoming: 10000,
          // heartbeatOutgoing: 10000,
          onConnect: () => {
            if (!alive) return;
            setConnected(true);
            subRef.current = c.subscribe("/user/queue/messages", (frame) => {
              try {
                const msg = JSON.parse(frame.body); // {chatRoomId, message, sentAt, senderEmail, ...}
                const rid = Number(msg?.chatRoomId);
                if (!Number.isFinite(rid)) return;
                setRooms((prev) => {
                  const next = new Map(prev);
                  next.set(rid, {
                    lastMessage: String(msg?.message ?? ""),
                    lastTime: String(msg?.sentAt ?? ""),
                  });
                  return next;
                });
              } catch {
                // noop
              }
            });
          },
          onStompError: () => setConnected(false),
          onWebSocketError: () => setConnected(false), // 추가됨
          onWebSocketClose: () => setConnected(false),
          debug: () => {},
        });

        c.activate();
        clientRef.current = c;
      } catch {
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
  }, [wsBase]);

  return { connected, rooms }; // rooms: Map(roomId -> {lastMessage, lastTime})
}
