import { useOutletContext } from "react-router-dom";

export default function IngCoursePage() {
  const { coursesProgress } = useOutletContext();

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-bold">수강중인 강의 페이지</h1>
      <pre className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap break-all">
        {coursesProgress.length === 0 ? (
          <div>수강중인 강의 없음</div>
        ) : (
          <ul className="space-y-2">
            {coursesProgress.map((p, idx) => (
              <li key={p?.id ?? idx} className="p-3 border rounded">
                <pre className="text-xs bg-gray-50 p-3 rounded whitespace-pre-wrap break-all">
                  {JSON.stringify(p, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </pre>
    </div>
  );
}
