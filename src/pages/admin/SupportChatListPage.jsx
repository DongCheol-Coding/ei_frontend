// src/pages/admin/SupportChatPage.jsx
/*
[변경 요약]
- 웹소켓/실시간 로직 제거
- REST API(/api/chat/rooms/mine)만 호출해 "채팅방 목록"을 보여줌
- 방을 클릭하면 /admin/support/chat/:roomId 로 라우팅
*/
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const ROOM_ROUTE_BASE = "/admin/chat";

export default function SupportChatPage() {
  const navigate = useNavigate();

  // 목록/상태
  const [rooms, setRooms] = useState([]); // [{ id, memberName, memberEmail, createdAt }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 초기 로딩: 채팅방 목록 호출 (Page 응답 형태 대응)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          "/api/chat/rooms/mine?status=open&size=50&sort=createdAt,desc",
          { credentials: "include" }
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
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

  // 정렬(백엔드가 DESC로 내려주지만, 방어적으로 한 번 더 최신순 정렬)
  const roomList = useMemo(() => {
    const arr = [...rooms];
    arr.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return arr;
  }, [rooms]);

  // 방 클릭 → 채팅화면으로 이동
  const handleEnterRoom = (roomId) => {
    navigate(`${ROOM_ROUTE_BASE}/${roomId}`);
  };

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="border rounded-lg bg-white p-3 flex items-center justify-between">
        <div className="text-sm font-semibold">상담자 콘솔</div>
        <div className="text-xs text-gray-500">채팅방 목록</div>
      </div>

      {/* 대화 목록 */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="px-3 py-2 text-sm border-b">
          <b>대화 목록</b>
        </div>

        {/* 로딩/에러/빈 상태 */}
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

        {/* 목록 */}
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
