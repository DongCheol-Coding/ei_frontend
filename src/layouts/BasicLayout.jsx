// src/layouts/BasicLayout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";
import TopBar from "../components/navbar/Topbar";

export default function BasicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="border-b-1 border-gray-200 px-30">
        <Navbar />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
