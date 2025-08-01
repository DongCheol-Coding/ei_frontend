import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import courseRouter from "./courseRouter";
import accountRouter from "./accountRouter";
import mypageRouter from "./mypageRouter";
import LoadingPage from "../pages/common/LoadingPage";
import NotFoundPage from "../pages/common/NotFoundPage";

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
    path: "account",
    children: accountRouter(),
  },
  {
    path: "mypage",
    children: mypageRouter(),
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default root;
