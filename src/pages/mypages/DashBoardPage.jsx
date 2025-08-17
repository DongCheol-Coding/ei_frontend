import { useOutletContext } from "react-router-dom";

export default function MyPageLandingPage() {
  const ctx = useOutletContext(); // 부모가 준 모든 값
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-bold">대시보드</h1>
      <pre className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap break-all">
        {JSON.stringify(ctx, null, 2)}
      </pre>
    </div>
  );
}
