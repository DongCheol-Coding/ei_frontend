// src/routes/index.jsx
import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import BasicLayout from "../layouts/BasicLayout";
import MyPageLayout from "../layouts/MyPageLayout";
import AdminPageLayout from "../layouts/AdminPageLayout";
import courseRouter from "./courseRouter";
import accountRouter from "./accountRouter";
import mypageRouter from "./mypageRouter";
import adminRouter from "./adminRouter";
import LoadingPage from "../pages/common/LoadingPage";
import NotFoundPage from "../pages/common/NotFoundPage";
import RequireAuth from "../pages/mypages/RequireAuth";
import AdminRequireAuth from "../pages/admin/RequireAdminAuth";

const LandingPage = lazy(() => import("../pages/LandingPage"));

const withSuspense = (element) => (
  <Suspense fallback={<LoadingPage />}>{element}</Suspense>
);

const root = createBrowserRouter([
  {
    element: <BasicLayout />, // 공통 레이아웃 적용
    children: [
      {
        index: true, // "/" 라우트
        element: withSuspense(<LandingPage />),
      },
      {
        path: "course",
        children: courseRouter(), // courseRouter 내부도 children 배열 반환한다고 가정
      },
      {
        path: "account",
        children: accountRouter(),
      },
      {
        element: <RequireAuth redirectTo="/" />,
        children: [
          {
            path: "mypage",
            element: <MyPageLayout />,
            children: mypageRouter(),
          },
        ],
      },
      {
        element: <AdminRequireAuth redirectTo="/" />,
        children: [
          {
            path: "admin",
            element: <AdminPageLayout />,
            children: adminRouter(),
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default root;
