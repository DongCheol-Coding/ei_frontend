import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import courseRouter from "./courseRouter";
import LoadingPage from "../pages/common/LoadingPage";

const LandingPage = lazy(() => import("../pages/LandingPage"));

const root = createBrowserRouter([
  {
    path: "",
    element: (
      <Suspense fallback={<LoadingPage />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: "course",
    children: courseRouter(),
  },
  {
    path: "*",
    element: <div>404 Not Found</div>,
  },
]);

export default root;
