import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchMe } from "./services/auth/authSlice";
import root from "./routes";

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return <RouterProvider router={root} />;
}

export default App;
