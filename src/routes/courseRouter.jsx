import { lazy, Suspense } from "react";
import LoadingPage from "../pages/common/LoadingPage";

const BackendPage = lazy(() => import("../pages/courses/BackendPage"));
const DataAIPage = lazy(() => import("../pages/courses/DataAIPage"));
const FrontendPage = lazy(() => import("../pages/courses/FrontendPage"));
const FullStackPage = lazy(() => import("../pages/courses/FullStackPage"));
const PaymentPage = lazy(() => import("../pages/courses/PaymentPage"));

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
      path: "payment",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <PaymentPage />
        </Suspense>
      ),
    },
  ];
}
