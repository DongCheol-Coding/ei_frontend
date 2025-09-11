import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { searchUsers } from "../../services/api/adminApi";
import noImage from "../../assets/mypage/noimage.png";

const ROOM_ROUTE_BASE = "/admin/chat";
const API_BASE = (import.meta.env.VITE_API_SERVER_HOST || "/api").replace(
  /\/$/,
  ""
);

export default function SupportChatPage() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]); // [{ id, memberName, memberEmail, createdAt }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // email(소문자) -> imageUrl 매핑 저장소
  const [avatarByEmail, setAvatarByEmail] = useState(() => new Map());

  // 날짜 표시 포맷(기존과 동일)
  const formatDate = (s) => String(s).replace("T", " ").slice(0, 16);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${API_BASE}/api/chat/rooms/mine?status=open&size=50&sort=createdAt,desc`,
          { credentials: "include", headers: { Accept: "application/json" } }
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

  // 전체 유저를 불러와 email -> imageUrl 맵 구성
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = (await searchUsers?.({})) ?? {};
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : Array.isArray(res?.body?.data)
          ? res.body.data
          : [];

        const map = new Map();
        for (const u of list) {
          if (!u || u.isDeleted) continue;
          const email = String(u.email || "").toLowerCase();
          const url = u.imageUrl || u.profileImageUrl || "";
          if (email) map.set(email, url);
        }
        if (alive) setAvatarByEmail(map);
      } catch (e) {
        console.warn("[SupportChatPage] searchUsers error:", e);
        if (alive) setAvatarByEmail(new Map());
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

  const handleEnterRoom = (roomId, memberEmail) => {
    const emailKey = String(memberEmail || "").toLowerCase();
    const avatarUrl = avatarByEmail.get(emailKey) || "";
    navigate(`${ROOM_ROUTE_BASE}/${roomId}`, {
      state: { peerAvatarUrl: avatarUrl },
    });
  };

  // Avatar: 이메일로 유저 이미지 찾기 + 실패/없음 시 noImage
  const Avatar = ({ name, email }) => {
    const emailKey = String(email || "").toLowerCase();
    const matchedUrl = avatarByEmail.get(emailKey) || "";
    const [broken, setBroken] = useState(false);

    const src = matchedUrl && !broken ? matchedUrl : noImage;
    const alt = (name || email || "회원") + " 프로필";

    return (
      <img
        src={src}
        alt={alt}
        className="h-10 w-10 rounded-full object-cover border"
        onError={() => setBroken(true)}
        referrerPolicy="no-referrer"
      />
    );
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
          <div className="max-h-[78vh] overflow-y-auto divide-y">
            {roomList.map((r) => {
              const displayName = r.memberName || r.memberEmail || "회원";
              return (
                <button
                  key={r.id}
                  onClick={() => handleEnterRoom(r.id, r.memberEmail)}
                  className="w-full px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 transition text-left"
                  aria-label={`${displayName}와의 대화 들어가기`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={r.memberName} email={r.memberEmail} />
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold truncate">
                        {displayName}
                      </div>
                      {r.memberEmail && r.memberName && (
                        <div className="text-xs text-gray-500 truncate">
                          {r.memberEmail}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                      {formatDate(r.createdAt)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
