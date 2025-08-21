import { lazy, Suspense } from "react";
import LoadingPage from "../pages/common/LoadingPage";

const AdminDashBoardPage = lazy(() =>
  import("../pages/admin/AdminDashBoardPage")
);
const UserPage = lazy(() => import("../pages/admin/AdminUserPage"));
const CoursePage = lazy(() => import("../pages/admin/AdminCoursePage"));
const AdminCourseLecturesPage = lazy(() =>
  import("../pages/admin/AdminCourseLecturesPage")
);

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
  ];
}
