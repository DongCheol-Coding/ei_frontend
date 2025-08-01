import { lazy, Suspense } from "react";
import LoadingPage from "../pages/common/LoadingPage";

const EmailLoginPage = lazy(() => import("../pages/accounts/EmailLoginPage"));
const EmailSignUpPage = lazy(() => import("../pages/accounts/EmailSignUpPage"));
const LoginLandingPage = lazy(() =>
  import("../pages/accounts/LoginLandingPage")
);

export default function accountRouter() {
  return [
    {
      path: "elogin",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <EmailLoginPage />
        </Suspense>
      ),
    },
    {
      path: "esignup",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <EmailSignUpPage />
        </Suspense>
      ),
    },
    {
      path: "",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <LoginLandingPage />
        </Suspense>
      ),
    },
  ];
}
