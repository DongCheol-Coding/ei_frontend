// src/components/profile/UserImage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  uploadProfileImage,
  deleteProfileImage,
} from "../../services/api/userImageApi";

export default function UserImage({ imageUrl, noImage }) {
  const [open, setOpen] = useState(false);

  // 표시용 이미지(업로드 성공 시 즉시 갱신)
  const baseSrc = useMemo(
    () => (imageUrl ?? "").trim() || noImage,
    [imageUrl, noImage]
  );
  const [displaySrc, setDisplaySrc] = useState(baseSrc);
  useEffect(() => setDisplaySrc(baseSrc), [baseSrc]);

  // 파일 선택/업로드 상태
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // 모달이 닫히면 입력값/상태 초기화
  useEffect(() => {
    if (!open) {
      setFile(null);
      setFileName("");
      setUploading(false);
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
      setError("파일 크기는 5MB 이하여야 합니다.");
      e.target.value = "";
      setFile(null);
      setFileName("");
      return;
    }
    setError(null);
    setFile(f);
    setFileName(f.name || "");
  };

  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const newUrl = await uploadProfileImage(file, {
        onProgress: (pe) => {
          if (pe.total) setProgress(Math.round((pe.loaded / pe.total) * 100));
        },
      });
      setDisplaySrc(newUrl); // 화면 즉시 갱신
      setOpen(false); // 모달 닫기
    } catch (e) {
      setError(e?.message || "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    if (uploading || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteProfileImage();
      setDisplaySrc(noImage); // 즉시 기본 이미지로 변경
      setOpen(false); // 모달 닫기
    } catch (e) {
      setError(e?.message || "이미지 초기화에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* 아바타 */}
      <div className="group relative mx-auto h-36 w-36 rounded-full overflow-hidden ring-1 ring-gray-200">
        <img
          src={displaySrc}
          alt="프로필 이미지"
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = noImage;
          }}
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold
                     bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100
                     transition focus:opacity-100 focus:bg-black/40"
          aria-label="프로필 이미지 수정"
        >
          수정
        </button>
      </div>

      {/* 모달 */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="user-image-modal-title"
              className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-5"
            >
              {/* 헤더 */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 id="user-image-modal-title" className="text-lg font-bold">
                  프로필 이미지 변경
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <span className="sr-only">닫기</span>✕
                </button>
              </div>

              {/* 파일 선택 */}
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-700
                               file:mr-3 file:px-4 file:py-2 file:rounded-lg
                               file:border-0 file:bg-gray-600 file:text-white
                               hover:file:bg-gray-700
                               file:cursor-pointer cursor-pointer"
                  />
                </div>
              </div>

              {/* 진행률/에러 */}
              {(uploading || error) && (
                <div className="mt-3">
                  {uploading && (
                    <div className="text-xs text-gray-500">
                      업로드 중... {progress ? `${progress}%` : ""}
                    </div>
                  )}
                  {error && (
                    <div className="text-xs text-red-600 mt-1">{error}</div>
                  )}
                </div>
              )}

              {/* 푸터 */}
              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full px-4 py-2 rounded-lg bg-blue-500 text-white disabled:opacity-60"
                >
                  {uploading ? "업로드 중..." : "수정"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={uploading || deleting}
                  className="w-full px-4 py-2 rounded-lg border border-red-300 text-red-700 disabled:opacity-60"
                >
                  {deleting ? "초기화 중..." : "이미지 초기화"}
                </button>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                권장: 정사각형, 최대 5MB
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
