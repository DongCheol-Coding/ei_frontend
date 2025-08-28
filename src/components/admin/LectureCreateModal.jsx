import { useEffect, useRef, useState } from "react";
import { createLectureWithVideo } from "../../services/api/courseApi";
import { toast } from "../ui/useToast";

export default function LectureCreateModal({
  open,
  onClose,
  token,
  courseId,
  onCreated, // 성공 시 호출(목록 새로고침 등)
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [orderIndexStr, setOrderIndexStr] = useState("0"); // 문자열 입력 후 숫자 변환
  const [isPublic, setIsPublic] = useState(true);

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
      setOrderIndexStr("0");
      setIsPublic(true);
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
    // 필요 시 용량 제한 추가 가능 (예: 1GB)
    // if (f.size > 1024 * 1024 * 1024) { ... }
    setError(null);
    setFile(f);
    setFileName(f.name || "");
  };

  const handleCreate = async () => {
    if (creating) return;

    const orderIndex = Number(String(orderIndexStr).replace(/[^\d-]/g, ""));
    if (!title.trim()) return setError("제목을 입력하세요.");
    if (Number.isNaN(orderIndex)) return setError("순서를 숫자로 입력하세요.");
    if (!file) return setError("영상 파일을 선택하세요.");

    setCreating(true);
    setProgress(0);
    setError(null);
    try {
      await createLectureWithVideo(
        courseId,
        {
          title: title.trim(),
          description: (description || "").trim(),
          orderIndex,
          isPublic,
          video: file,
        },
        {
          token,
          onProgress: setProgress,
        }
      );
      toast.success("강의 영상이 정상적으로 등록되었습니다.");
      onClose?.();
      onCreated?.(); // 부모에서 목록 새로고침
    } catch (e) {
      setError(e?.message || "강의 영상 등록에 실패했습니다.");
      toast.error(e?.message || "강의 영상 등록에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lecture-create-modal-title"
          className="w-full max-w-md bg-white rounded-2xl shadow-lg p-5"
        >
          {/* 헤더 */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 id="lecture-create-modal-title" className="text-lg font-bold">
              강의 영상 등록
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <span className="sr-only">닫기</span>✕
            </button>
          </div>

          {/* 폼 (CourseCreateModal과 동일 스타일) */}
          <div className="space-y-3">
            {/* 제목 */}
            <div className="flex flex-col">
              <label className="text-[11px] text-gray-500 mb-1">제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border rounded px-2 py-1.5 text-sm"
                placeholder="예) 1강. OT & 과정 소개"
              />
            </div>

            {/* 설명 */}
            <div className="flex flex-col">
              <label className="text-[11px] text-gray-500 mb-1">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border rounded px-2 py-1.5 text-sm min-h-24"
                placeholder="강의 설명을 입력하세요"
              />
            </div>

            {/* 순서 & 공개 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-[11px] text-gray-500 mb-1">순서</label>
                <input
                  value={orderIndexStr}
                  onChange={(e) => setOrderIndexStr(e.target.value)}
                  inputMode="numeric"
                  className="border rounded px-2 py-1.5 text-sm"
                  placeholder="예) 0"
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm select-none">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4"
                  />
                  공개
                </label>
              </div>
            </div>

            {/* 영상 파일 */}
            <div className="flex flex-col">
              <label className="text-[11px] text-gray-500 mb-1">
                영상 파일
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
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
                    업로드 중... {progress ? `${progress}%` : ""}
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
              {creating ? "업로드 중..." : "등록"}
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
              권장: MP4/H.264, 용량은 인프라 정책에 맞게 제한하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
