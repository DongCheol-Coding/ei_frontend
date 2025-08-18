// src/layouts/BasicLayout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";
import TopBar from "../components/navbar/Topbar";
import Footer from "../components/navbar/Footer";

export default function BasicLayout() {
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
    </div>
  );
}
