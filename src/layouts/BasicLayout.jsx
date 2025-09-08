// src/layouts/BasicLayout.jsx
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/navbar/Navbar";
import TopBar from "../components/navbar/Topbar";
import Footer from "../components/navbar/Footer";
import FloatingChatWidget from "../components/chat/FloatingChatWidget";
import { selectIsAuth, selectHydrated } from "../services/auth/authSlice";

export default function BasicLayout() {
  const isAuth = useSelector(selectIsAuth);
  const hydrated = useSelector(selectHydrated);

  const roles = useSelector((s) =>
    Array.isArray(s.auth?.user?.roles) ? s.auth.user.roles : []
  );

  const isPrivileged =
    roles.includes("ROLE_ADMIN") || roles.includes("ROLE_SUPPORT");

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="px-30">
        <Navbar />
      </div>
      <main className="flex-1 mt-[98px] min-h-[calc(100vh-98px)] flex items-center justify-center">
        <Outlet />
      </main>
      <Footer className="mt-auto" />
      
      {hydrated && isAuth && !isPrivileged && <FloatingChatWidget />}
    </div>
  );
}
