import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchMe } from "./services/auth/authSlice";
import root from "./routes";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const path = window.location.pathname;
    const isAuthPage = /^\/account\/(login|signup|kakaoauth)/.test(path);
    if (!isAuthPage) {
      dispatch(fetchMe()); // 인증 페이지가 아닐 때만 실행
    }
  }, [dispatch]);

  return <RouterProvider router={root} />;
}

export default App;
