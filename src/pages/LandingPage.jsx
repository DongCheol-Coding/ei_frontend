import backgroundImg from "../assets/landing/main-head-pc.avif";

export default function LandingPage() {
  return (
    <section className="relative w-full h-[calc(100vh-98px)] flex items-center justify-center overflow-hidden">
      {/* 배경 이미지 */}
      <img
        src={backgroundImg}
        alt="랜딩 페이지 배경"
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />

      {/* 텍스트 콘텐츠 */}
      <div className="relative z-10 max-w-4xl px-4 text-center text-white">
        <h1 className="font-bold leading-tight text-[clamp(2.5rem,8vw,6rem)]">
          Change Your Life,
          <br /> Be a Change Maker
        </h1>
        <p className="mt-6 text-base md:text-lg">
          New York, 실리콘밸리 글로벌 기업들과 함께 프로젝트 협업을 하고,&nbsp;
          <br className="hidden lg:block" />
          하버드 대학 연구실을 방문하며, 회사들이 모셔가는 취업을 만듭니다
        </p>
        <p className="mt-4 text-base md:text-lg">
          당신의 인생을 바꾸고 싶다면,
          <br />
          슈퍼코딩이 당신의 인생을 바꿀 최고의 선택입니다.
        </p>
      </div>
    </section>
  );
}
