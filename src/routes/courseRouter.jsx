import { lazy, Suspense } from "react";
import LoadingPage from "../pages/common/LoadingPage";

const BackendPage = lazy(() => import("../pages/courses/BackendPage"));
const DataAIPage = lazy(() => import("../pages/courses/DataAIPage"));
const FrontendPage = lazy(() => import("../pages/courses/FrontendPage"));
const FullStackPage = lazy(() => import("../pages/courses/FullStackPage"));
const PaymentPage = lazy(() => import("../pages/courses/PaymentPage"));
const KakaoPayApprovePage = lazy(() =>
  import("../pages/courses/KakaoPayApprovePage")
);
import RequireAuth from "../pages/common/RequireAuth";

export default function courseRouter() {
  return [
    {
      path: "backend",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <BackendPage />
        </Suspense>
      ),
    },
    {
      path: "data",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <DataAIPage />
        </Suspense>
      ),
    },
    {
      path: "frontend",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <FrontendPage />
        </Suspense>
      ),
    },
    {
      path: "fullstack",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <FullStackPage />
        </Suspense>
      ),
    },
    {
      element: <RequireAuth redirectTo="/account/loginchoice" />,
      children: [
        {
          path: "payment",
          element: (
            <Suspense fallback={<LoadingPage />}>
              <PaymentPage />
            </Suspense>
          ),
        },
      ],
    },
    {
      path: "kakaopay",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <KakaoPayApprovePage />
        </Suspense>
      ),
    },
  ];
}
