// 상담자 인박스 실시간 수신 훅: /user/queue/messages 전체를 받아 방 리스트/미리보기 갱신
import { useEffect, useRef, useState } from "react";

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
        const base = wsBase || `${location.protocol}//${location.host}/ws`;
        const webSocketFactory = () => new SockJS(base);

        const c = new Client({
          webSocketFactory,
          reconnectDelay: 3000,
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
              } catch {}
            });
          },
          onStompError: () => setConnected(false),
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
