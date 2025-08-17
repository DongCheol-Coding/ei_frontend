import { api } from "../api/basicApi";

export async function uploadProfileImage(file, opts = {}) {
  if (!(file instanceof File)) {
    throw new Error("유효한 이미지 파일이 필요합니다.");
  }

  const form = new FormData();
  form.append("image", file);

  const res = await api.patch("/api/auth/profile/image", form, {
    signal: opts.signal,
    onUploadProgress: opts.onProgress,
  });

  const body = res?.data;
  const url =
    typeof body?.data === "string"
      ? body.data
      : typeof body === "string"
      ? body
      : "";
  if (!url) {
    throw new Error(body?.message || "이미지 업로드 응답이 올바르지 않습니다.");
  }
  return url;
}

export async function deleteProfileImage(opts = {}) {
  const res = await api.delete("/api/auth/profile/image", {
    signal: opts.signal,
  });
  if (res.status >= 200 && res.status < 300) return true;
  throw new Error(res?.data?.message || "이미지 초기화에 실패했습니다.");
}
