import { lazy, Suspense } from "react";
import LoadingPage from "../pages/common/LoadingPage";

const BackendPage = lazy(() => import("../pages/Courses/BackendPage"));
const DataAIPage = lazy(() => import("../pages/Courses/DataAIPage"));
const FrontendPage = lazy(() => import("../pages/Courses/FrontendPage"));
const FullStackPage = lazy(() => import("../pages/Courses/FullStackPage"));

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
  ];
}
