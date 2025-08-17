import { Outlet } from "react-router-dom";
import AdminSideBar from "../components/mypage/AdminSideBar";

export default function AdminPageLayout() {
  return (
    <div className="w-full h-[calc(100vh-98px)] bg-gray-50 p-20">
      <div className="mx-auto max-w-7xl h-full">
        <div className="grid grid-cols-[16rem_1fr] gap-6 h-full">
          <AdminSideBar />
          <main className="space-y-6">
            {/* 페이지 내용 */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <Outlet />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
