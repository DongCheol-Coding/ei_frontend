// src/components/admin/CourseCreateModal.jsx
import { useEffect, useRef, useState } from "react";
import { createCourse } from "../../services/api/courseApi";
import { toast } from "../../components/ui/useToast";

const krw = (n) => new Intl.NumberFormat("ko-KR").format(Number(n ?? 0));

export default function CourseCreateModal({
  open,
  onClose,
  token,
  onCreated, // 성공 시 호출(목록 새로고침 등)
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceStr, setPriceStr] = useState(""); // 입력 문자열
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");

  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setPriceStr("");
      setFile(null);
      setFileName("");
      setCreating(false);
      setProgress(0);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) {
      setFile(null);
      setFileName("");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("이미지 파일은 최대 5MB까지 업로드 가능합니다.");
      e.target.value = "";
      setFile(null);
      setFileName("");
      return;
    }
    setError(null);
    setFile(f);
    setFileName(f.name || "");
  };

  const handleCreate = async () => {
    if (creating) return;

    const cleanPrice = Number(String(priceStr).replace(/\D/g, "")) || 0;
    if (!title.trim()) return setError("제목을 입력하세요.");
    if (!description.trim()) return setError("설명을 입력하세요.");
    if (!cleanPrice) return setError("가격을 입력하세요.");
    if (!file) return setError("이미지를 선택하세요.");

    setCreating(true);
    setProgress(0);
    setError(null);
    try {
      await createCourse(
        {
          title: title.trim(),
          description: description.trim(),
          price: cleanPrice,
          image: file,
        },
        {
          token,
          onProgress: setProgress,
        }
      );
      toast.success("코스가 정상적으로 등록되었습니다.");
      onClose?.();
      onCreated?.(); // 부모에서 목록 새로고침
    } catch (e) {
      setError(e?.message || "코스 등록에 실패했습니다.");
      toast.error(e?.message || "코스 등록에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  const priceNum = Number(String(priceStr).replace(/\D/g, "")) || 0;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-create-modal-title"
          className="w-full max-w-md bg-white rounded-2xl shadow-lg p-5"
        >
          {/* 헤더 */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 id="course-create-modal-title" className="text-lg font-bold">
              강의 등록
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <span className="sr-only">닫기</span>✕
            </button>
          </div>

          {/* 폼 */}
          <div className="space-y-3">
            <div className="flex flex-col">
              <label className="text-[11px] text-gray-500 mb-1">제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border rounded px-2 py-1.5 text-sm"
                placeholder="예) 동철코딩 백엔드 강의"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] text-gray-500 mb-1">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border rounded px-2 py-1.5 text-sm min-h-24"
                placeholder="코스 설명을 입력하세요"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] text-gray-500 mb-1">가격(원)</label>
              <input
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                inputMode="numeric"
                className="border rounded px-2 py-1.5 text-sm"
                placeholder="예) 990000"
              />
              <div className="text-xs text-gray-500 mt-1">
                미리보기: ₩ {krw(priceNum)}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] text-gray-500 mb-1">이미지</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-700
                           file:mr-3 file:px-4 file:py-2 file:rounded-lg
                           file:border-0 file:bg-blue-600 file:text-white
                           hover:file:bg-blue-700
                           file:cursor-pointer cursor-pointer"
              />
              {fileName && (
                <div className="text-[11px] text-gray-500 mt-1">{fileName}</div>
              )}
            </div>

            {/* 진행/에러 */}
            {(creating || error) && (
              <div>
                {creating && (
                  <div className="text-xs text-gray-500">
                    등록 중... {progress ? `${progress}%` : ""}
                  </div>
                )}
                {error && (
                  <div className="text-xs text-red-600 mt-1">{error}</div>
                )}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
            >
              {creating ? "등록 중..." : "등록"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="w-full px-4 py-2 rounded-lg border disabled:opacity-60"
            >
              취소
            </button>
            <p className="mt-1 text-[11px] text-gray-500">
              권장: 정사각형, 최대 5MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
