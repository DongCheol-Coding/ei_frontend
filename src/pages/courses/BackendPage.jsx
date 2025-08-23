import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCoursePreview } from "../../services/api/courseApi";

import backgroundImg from "../../assets/backend/product-head-img-BE.png";
import whiteCross from "../../assets/white-cross.svg";
import priceUpBuble from "../../assets/backend/price-up-bubble-BE.svg";
import StickyCard from "../../components/course/StickyCard";

export default function BackendPage() {
  const navigate = useNavigate();
  const courseId = 4;

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const d = await getCoursePreview(courseId);
        setTitle(d?.title ?? "");
        const p =
          typeof d?.price === "number" ? d.price : Number(d?.price ?? 0);
        setPrice(Number.isFinite(p) ? p : 0);
      } catch {
        // 미리보기 호출 실패 시 기본값 유지
      }
    })();
  }, [courseId]);

  return (
    <section className="relative w-full h-[calc(100vh-98px)] flex flex-col items-center justify-center text-white">
      {/* 1) 뒤 그라디언트 엘립스 */}
      <div
        className="
            absolute inset-0 z-10
            bg-gradient-to-t
            from-[#2e34ba]
            via-[#2e34ba]
            to-[#1a2246]
          "
      />

      {/* 2) 로고 형태 이미지 (크기 축소) */}
      <img
        src={backgroundImg}
        alt="랜딩 페이지 배경"
        loading="lazy"
        className="
            absolute
            z-20
            w-[400px]
            h-auto
            pointer-events-none
            top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2
          "
      />

      {/* 3) 문구 및 버튼 */}
      <div className="absolute z-30 flex flex-col items-center justify-center text-center p-4">
        {/* 상단 텍스트 */}
        <p className="text-sm md:text-base font-bold mb-2 tracking-wide mt-20 flex justify-center items-center">
          <span style={{ color: "#ffda46" }}>개발자 부트캠프 1위 슈퍼코딩</span>
          <img
            src={whiteCross}
            className="mx-2"
            alt="흰색 십자가"
            style={{ height: "0.8em" }}
          />
          <span style={{ color: "#5794ff" }}>취업률 1위 취업전문가</span>
        </p>

        {/* 메인 헤드라인 */}
        <div className="mt-20">
          <h1 className="text-7xl font-extrabold leading-tight mb-4 text-white">
            <span style={{ color: "#ffda46" }}>개발자 취업 집사</span>
            와 <br /> 공부부터 취업성공까지 <br /> 100% 보장
          </h1>

          {/* 서브 텍스트 */}
          <p className="text-lg font-medium mt-10 mb-6">
            더 이상 혼자 하지 마세요. <br /> 모든 과정을 개발자 취업집사가
            함께합니다.
          </p>
        </div>

        {/* CTA 버튼 */}
        <div className="mt-18 flex flex-col items-center">
          <img src={priceUpBuble} alt="Price Up Bubble" />
          <button
            onClick={() => navigate(`/course/payment?courseId=${courseId}`)}
            className="font-bold py-4 px-20 rounded-xl shadow-lg transition-all duration-200 focus:outline-none mt-2
             bg-[#ffda46] text-[#1A2246] hover:bg-[#f2cf2d] active:bg-[#e6bc12]"
          >
            100% 보장 받고 시작하기
          </button>
        </div>

        {/* 하단 각주 */}
        <div className="text-[10px] text-gray-300 mt-8 max-w-2xl text-center">
          <p>
            * 개발자 부트캠프 1위 : 2023년 6월, 7월에 시작하는 온라인 웹개발
            부트캠프 유료 수강생 수 합산 기준
          </p>
          <p>
            (부트텐트 내 코딩 기업별 6,7월에 개강하는 부트캠프 상품 모집인원)
          </p>
          <p>* 취업률 1위 : M사 전국 지점 평균 취업률 1위, 취업자 수 1위</p>
        </div>
      </div>

      <StickyCard
        top={110}
        dDay={5}
        courseId={courseId}
        title={title}
        originalPrice={price}
        onCtaClick={(cid) => navigate(`/course/payment?courseId=${cid}`)}
      />
    </section>
  );
}
