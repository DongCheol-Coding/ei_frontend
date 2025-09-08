import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  define: {
    global: "window", // SockJS가 참조하는 global을 window로 치환
  },
  optimizeDeps: {
    include: ["sockjs-client"],
  },
});
