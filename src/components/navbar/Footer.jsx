import dc_logo from "../../assets/cd_logo.png";

export default function Navbar() {
  return (
    <footer className="w-full border-t border-t-gray-300">
      <div className="container max-w-8xl mx-auto p-10">
        <img
          src={dc_logo}
          alt="동철코딩 로고"
          className="h-7 w-auto opacity-70"
          loading="lazy"
        />
        <div className="mt-6 text-gray-500 space-y-2">
          <p className="text-lg font-extrabold">(주)동철코딩 사업자정보</p>
          <p className="mt-2">
            공동 대표: 이동현, 하민철 사업자등록번호: 2025-08 통신판매업
            신고번호: 2025-서울강남-00001
          </p>
          <p>주소: 서울특별시 강남구 도곡로 1길 10, 프린스타워 9층</p>
        </div>
      </div>
    </footer>
  );
}
