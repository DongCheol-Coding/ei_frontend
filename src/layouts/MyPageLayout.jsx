import { Outlet } from "react-router-dom";
import SideBar from "../components/mypage/SideBar";

export default function MyPageLayout() {
  return (
    <div className="w-full h-[calc(100vh-98px)] bg-gray-50 p-20">
      <div className="mx-auto max-w-7xl h-full">
        <div className="grid grid-cols-[16rem_1fr] gap-6 h-full">
          <SideBar>
            <h1>마이페이지</h1>
          </SideBar>
          <main className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 px-5 py-6">
              <div className="text-[25px] text-indigo-700 font-semibold text-center">
                "언젠가 이 모든 것을 이겨냈다는게 자랑스러워질 거예요."
              </div>
            </div>

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
