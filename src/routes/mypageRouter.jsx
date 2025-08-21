import { lazy, Suspense } from "react";
import LoadingPage from "../pages/common/LoadingPage";

const MyPageLandingPage = lazy(() => import("../pages/mypages/DashBoardPage"));
const EndCoursePage = lazy(() => import("../pages/mypages/EndCoursePage"));
const IngCoursePage = lazy(() => import("../pages/mypages/IngCoursePage"));
const PaymentsHistoryPage = lazy(() =>
  import("../pages/mypages/PaymentsHistoryPage")
);
const PracticePage = lazy(() => import("../pages/mypages/PracticePage"));
const PracticeQnAPage = lazy(() => import("../pages/mypages/PracticeQnAPage"));
const ProfilePage = lazy(() => import("../pages/mypages/ProfilePage"));

export default function mypageRouter() {
  return [
    {
      path: "",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <MyPageLandingPage />
        </Suspense>
      ),
    },
    {
      path: "endcourse",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <EndCoursePage />
        </Suspense>
      ),
    },
    {
      path: "ingcourse",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <IngCoursePage />
        </Suspense>
      ),
    },
    {
      path: "paymentshistory",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <PaymentsHistoryPage />
        </Suspense>
      ),
    },
    {
      path: "practice",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <PracticePage />
        </Suspense>
      ),
    },
    {
      path: "practiceqna",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <PracticeQnAPage />
        </Suspense>
      ),
    },
    {
      path: "profile",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <ProfilePage />
        </Suspense>
      ),
    },
  ];
}
