import { lazy, Suspense } from "react";
import LoadingPage from "../pages/common/LoadingPage";

const EmailLoginPage = lazy(() => import("../pages/accounts/EmailLoginPage"));
const EmailSignUpPage = lazy(() => import("../pages/accounts/EmailSignUpPage"));
const KakaoAuthPage = lazy(() => import("../pages/accounts/KakaoAuthPage"));
const LoginLandingPage = lazy(() =>
  import("../pages/accounts/LoginLandingPage")
);
const SignUpLandingPage = lazy(() =>
  import("../pages/accounts/SignUpLandingPage")
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
      path: "kakaoauth",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <KakaoAuthPage />
        </Suspense>
      ),
    },
    {
      path: "loginchoice",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <LoginLandingPage />
        </Suspense>
      ),
    },
    {
      path: "signupchoice",
      element: (
        <Suspense fallback={<LoadingPage />}>
          <SignUpLandingPage />
        </Suspense>
      ),
    },
  ];
}
