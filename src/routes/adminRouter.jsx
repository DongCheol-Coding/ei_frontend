import { lazy, Suspense } from "react";
import LoadingPage from "../pages/common/LoadingPage";

import AdminRequireAuth from "../pages/admin/RequireAdminAuth";

const AdminDashBoardPage = lazy(() =>
  import("../pages/admin/AdminDashBoardPage")
);
const UserPage = lazy(() => import("../pages/admin/AdminUserPage"));
const CoursePage = lazy(() => import("../pages/admin/AdminCoursePage"));
const AdminCourseLecturesPage = lazy(() =>
  import("../pages/admin/AdminLecturesPage")
);
const SupportChatListPage = lazy(() =>
  import("../pages/admin/SupportChatListPage")
);
const SupportChatRoomPage = lazy(() =>
  import("../pages/admin/SupportChatRoomPage")
);

import AdminLectureDetailPage from "../pages/admin/AdminLectureDetailPage";

export default function adminRouter() {
  return [
    {
      path: "",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <AdminDashBoardPage />
        </Suspense>
      ),
    },
    {
      path: "user",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <UserPage />
        </Suspense>
      ),
    },
    {
      path: "course",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <CoursePage />
        </Suspense>
      ),
    },
    {
      path: "course/:courseId/lectures",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <AdminCourseLecturesPage />
        </Suspense>
      ),
    },
    {
      path: "lectures/:lectureId",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <AdminLectureDetailPage />
        </Suspense>
      ),
    },
    // 문의하기는 "info@dongcheolcoding.life 계정만 접근 가능"
    {
      element: (
        <AdminRequireAuth allowedEmails={["info@dongcheolcoding.life"]} />
      ),
      children: [
        {
          path: "chat",
          element: (
            <Suspense fallback={<LoadingPage />}>
              <SupportChatListPage />
            </Suspense>
          ),
        },
        {
          path: "chat/:roomId",
          element: (
            <Suspense fallback={<LoadingPage />}>
              <SupportChatRoomPage />
            </Suspense>
          ),
        },
      ],
    },
  ];
}
