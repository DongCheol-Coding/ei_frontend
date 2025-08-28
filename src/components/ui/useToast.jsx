/*
[추가됨] 전역 토스트 훅 & 유틸 (Provider 불필요)
- 파일이 로드되면 자동으로 호스트가 마운트되어 우상단 토스트가 표시됩니다.
- 사용 1: import "./components/ui/useToats";  // App.jsx 등에서 한 줄 임포트
- 사용 2: import { useToast, toast } from "./components/ui/useToats";
*/
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

let __seq = 0;
const nextId = () => ++__seq;
const bus = typeof window !== "undefined" ? new EventTarget() : null;

const STYLE = {
  info: "bg-blue-500 text-white text-center font-bold rounded-xl",
  success: "bg-green-600 text-white text-center font-bold rounded-xl",
  warning: "bg-amber-500 text-black text-center font-bold rounded-xl",
  error: "bg-red-500 text-white text-center font-bold rounded-xl",
};

// 최초 1회만 호스트 마운트
function ensureHost() {
  if (typeof window === "undefined") return;
  if (document.getElementById("__toast-host")) return;
  const el = document.createElement("div");
  el.id = "__toast-host";
  document.body.appendChild(el);
  const root = createRoot(el);
  root.render(<ToastHost />);
}
ensureHost();

function ToastHost() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onShow = (e) => {
      const {
        message = "",
        variant = "info",
        duration = 2500,
      } = e.detail || {};
      const id = nextId();
      setItems((prev) =>
        [...prev, { id, message: String(message), variant, duration }].slice(-4)
      );
    };
    bus.addEventListener("toast:show", onShow);
    return () => bus.removeEventListener("toast:show", onShow);
  }, []);

  const close = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-8 z-[9999] w-full max-w-sm pointer-events-none">
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <ToastItem key={it.id} item={it} onClose={() => close(it.id)} />
        ))}
      </div>
    </div>
  );
}

function ToastItem({ item, onClose }) {
  const { message, variant, duration } = item;
  const [closing, setClosing] = useState(false);
  const tRef = useRef(null);

  useEffect(() => {
    tRef.current = setTimeout(() => startClose(), Math.max(0, duration));
    return () => clearTimeout(tRef.current);
  }, [duration]);

  const startClose = () => {
    setClosing(true);
    setTimeout(onClose, 160);
  };

  return (
    <div
      role="status"
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={[
        "pointer-events-auto rounded-2xl shadow-lg px-4 py-3 text-sm transition ease-out",
        closing ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0",
        STYLE[variant] || STYLE.info,
      ].join(" ")}
      onMouseEnter={() => clearTimeout(tRef.current)}
      onMouseLeave={() => {
        tRef.current = setTimeout(() => startClose(), Math.max(0, duration));
      }}
    >
      {message}
    </div>
  );
}

// 훅: 컴포넌트에서 간편 호출
export function useToast(preset = { duration: 2500 }) {
  return useMemo(() => {
    const send = (detail) =>
      bus?.dispatchEvent(new CustomEvent("toast:show", { detail }));
    const base = (message, opts = {}) =>
      send({
        message,
        variant: opts.variant ?? "info",
        duration: opts.duration ?? preset.duration,
      });

    base.info = (m, d) =>
      send({ message: m, variant: "info", duration: d ?? preset.duration });
    base.success = (m, d) =>
      send({ message: m, variant: "success", duration: d ?? preset.duration });
    base.warning = (m, d) =>
      send({
        message: m,
        variant: "warning",
        duration: d ?? preset.duration + 500,
      });
    base.error = (m, d) =>
      send({
        message: m,
        variant: "error",
        duration: d ?? Math.max(4000, preset.duration),
      });

    return base;
  }, [preset.duration]);
}

// 훅 없이도 사용 가능한 전역 유틸
export const toast = Object.assign(
  (message, opts = {}) =>
    bus?.dispatchEvent(
      new CustomEvent("toast:show", { detail: { message, ...opts } })
    ),
  {
    info: (m, d) =>
      bus?.dispatchEvent(
        new CustomEvent("toast:show", {
          detail: { message: m, variant: "info", duration: d ?? 2500 },
        })
      ),
    success: (m, d) =>
      bus?.dispatchEvent(
        new CustomEvent("toast:show", {
          detail: { message: m, variant: "success", duration: d ?? 2500 },
        })
      ),
    warning: (m, d) =>
      bus?.dispatchEvent(
        new CustomEvent("toast:show", {
          detail: { message: m, variant: "warning", duration: d ?? 3000 },
        })
      ),
    error: (m, d) =>
      bus?.dispatchEvent(
        new CustomEvent("toast:show", {
          detail: {
            message: m,
            variant: "error",
            duration: Math.max(4000, d ?? 3000),
          },
        })
      ),
  }
);
