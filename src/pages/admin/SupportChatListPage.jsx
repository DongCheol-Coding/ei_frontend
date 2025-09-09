import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const ROOM_ROUTE_BASE = "/admin/support/chat";
const API_BASE = (import.meta.env.VITE_API_SERVER_HOST || "/api").replace(
  /\/$/,
  ""
);

export default function SupportChatPage() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]); // [{ id, memberName, memberEmail, createdAt }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${API_BASE}/api/chat/rooms/mine?status=open&size=50&sort=createdAt,desc`,
          {
            credentials: "include",
            headers: { Accept: "application/json" },
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const content = Array.isArray(data) ? data : data?.content ?? [];
        const mapped = content.map((r) => ({
          id: Number(r.roomId),
          memberName: r.memberName ?? "",
          memberEmail: r.memberEmail ?? "",
          createdAt: r.createdAt ?? "",
        }));
        if (alive) setRooms(mapped);
      } catch (e) {
        if (alive) {
          console.warn("[SupportChatPage] rooms fetch error:", e);
          setError("채팅방 목록을 불러오지 못했습니다.");
          setRooms([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const roomList = useMemo(() => {
    const arr = [...rooms];
    arr.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return arr;
  }, [rooms]);

  const handleEnterRoom = (roomId) => {
    navigate(`${ROOM_ROUTE_BASE}/${roomId}`);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="border rounded-lg bg-white p-3 flex items-center justify-between">
        <div className="text-sm font-semibold">상담자 콘솔</div>
        <div className="text-xs text-gray-500">채팅방 목록</div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="px-3 py-2 text-sm border-b">
          <b>대화 목록</b>
        </div>

        {loading && (
          <div className="p-4 text-sm text-gray-500">불러오는 중...</div>
        )}
        {!loading && error && (
          <div className="p-4 text-sm text-red-600">{error}</div>
        )}
        {!loading && !error && roomList.length === 0 && (
          <div className="p-4 text-sm text-gray-500">
            수신된 대화가 없습니다. 새 메시지가 오면 여기에 표시됩니다.
          </div>
        )}

        {!loading && !error && roomList.length > 0 && (
          <div className="max-h-[78vh] overflow-y-auto">
            {roomList.map((r) => (
              <button
                key={r.id}
                onClick={() => handleEnterRoom(r.id)}
                className="w-full text-left px-3 py-2 border-b hover:bg-gray-50"
              >
                <div className="text-sm font-medium">방 #{r.id}</div>
                <div className="text-xs text-gray-600">
                  {r.memberName || r.memberEmail || "회원"}
                </div>
                <div className="text-[10px] text-gray-400">
                  {String(r.createdAt).replace("T", " ").slice(0, 16)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
