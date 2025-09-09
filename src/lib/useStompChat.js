import { useEffect, useRef, useState, useCallback } from "react";
import { getMessages } from "../services/api/chatApi";

export function useStompChat(roomId) {
  const clientRef = useRef(null);
  const subRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- 초기 히스토리 로딩 (REST) ---
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

  // --- SockJS + STOMP 연결 ---
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

        // 쿠키(Path=/api) 부착을 위해 /api 프리픽스 경로 사용 (Vite proxy가 /ws-chat-sockjs 로 리라이트)
        const base =
          (location.protocol === "https:" ? "https://" : "http://") +
          "api.dongcheolcoding.life/api/ws-chat-sockjs";

        const webSocketFactory = () =>
          new SockJS(base, null, {
            withCredentials: true,
            transports: ["websocket", "xhr-streaming", "xhr-polling"],
          });

        const c = new Client({
          webSocketFactory,
          reconnectDelay: 3000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          debug: (m) => console.log("[STOMP][sockjs]", m),
          onConnect: () => {
            if (!alive) return;
            console.log("[STOMP] connected (sockjs)");
            setConnected(true);

            // 개인 큐 구독: 백엔드 SimpMessagingTemplate.convertAndSendToUser(..., "/queue/messages", ...)
            subRef.current = c.subscribe("/user/queue/messages", (frame) => {
              try {
                const msg = JSON.parse(frame.body);
                // 동일 방 메시지만 추가
                if (msg?.chatRoomId === roomId) {
                  setInbox((prev) => [...prev, msg]);
                }
              } catch (e) {
                console.warn("[STOMP] invalid message body:", e);
              }
            });
          },
          onWebSocketClose: () => {
            if (!alive) return;
            console.warn("[STOMP] websocket closed");
            setConnected(false);
          },
          onStompError: (f) => {
            if (!alive) return;
            console.warn("[STOMP] stomp error", f);
            setConnected(false);
          },
          onWebSocketError: (e) => {
            if (!alive) return;
            console.warn("[STOMP] websocket error", e);
            setConnected(false);
          },
        });

        c.activate();
        clientRef.current = c;
      } catch (e) {
        console.warn("[STOMP] module load/connect error", e);
        setError("실시간 연결 모듈을 불러오지 못했습니다.");
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
  }, [roomId]);

  // --- 전송 (STOMP) ---
  const send = useCallback(
    (text) => {
      const t = String(text ?? "").trim();
      if (!t) return;
      const c = clientRef.current;
      if (!c || !connected) {
        console.warn("[STOMP] not connected, skip send");
        return;
      }
      const body = JSON.stringify({ chatRoomId: roomId, message: t });
      console.log("[SEND] /app/chat.send", { roomId, text: t });
      c.publish({ destination: "/app/chat.send", body });
    },
    [connected, roomId]
  );

  return { connected, inbox, loading, send, error };
}

export default useStompChat;
