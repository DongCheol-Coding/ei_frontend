import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="flex items-center justify-center h-screen bg-blue-100">
        <h1 className="text-5xl font-extrabold text-blue-600 underline">
          Tailwind 적용 확인 완료!
        </h1>
      </div>
    </>
  );
}

export default App;
