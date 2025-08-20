import backgroundImg from "../../assets/data/ai-main-background-pc.avif";
import dalpha from "../../assets/data/DALPHA.avif";
import thoughtly from "../../assets/data/thoughtly.avif";
import StickyCard from "../../components/course/StickyCard";

export default function DataAIPage() {
  return (
    <section className="relative w-full h-[calc(100vh-98px)] flex items-center justify-center ">
      <div className="absolute w-[100%] h-full bg-[radial-gradient(circle_at_left_bottom,theme(colors.sky.100),theme(colors.white))]" />
      <img
        src={backgroundImg}
        alt="랜딩 페이지 배경"
        className="absolute z-20 w-[115vh] h-[110%] object-cover mt-30 ml-30 opacity-90"
        loading="lazy"
      />

      {/* 텍스트 오버레이 */}
      <div
        className="
            absolute
            z-30
            flex flex-col items-center text-center
            px-4
            max-w-3xl
          "
      >
        {/* 로고 텍스트 */}
        <div className="flex items-center space-x-5">
          <div className="flex flex-col items-end space-y-1">
            <span className="px-2 py-1 bg-white text-[#3fd416] rounded-full border border-black/10 text-[12px]">
              해외 최고 AI기업 연계
            </span>
            <img
              src={thoughtly}
              alt="Thoughtly 로고"
              className="h-7 mt-1" /* 필요에 따라 높이 조절 */
              loading="lazy"
            />
          </div>
          <div className="flex flex-col items-start space-y-1">
            <span className="px-2 py-1 bg-white text-[#f85800] rounded-full border border-black/10 text-[12px]">
              국내 최고 AI기업 연계
            </span>
            <img
              src={dalpha}
              alt="DαLPHA 로고"
              className="h-7 mt-1" /* 동일한 높이로 맞추면 깔끔합니다 */
              loading="lazy"
            />
          </div>
        </div>

        {/* 메인 헤드라인 */}
        <h2 className="mt-10 text-5xl font-light text-blue-700 leading-tight">
          문과 출신도
          <br />
          100% 취업 보장
        </h2>
        <h1 className="text-7xl font-extrabold leading-tight">
          취업 연수
          <br />
          DATA/AI 부트캠프
        </h1>

        {/* 서브 설명 */}
        <p className="bg-white/10 backdrop-blur-[12px] mt-20 px-2 leading-relaxed text-blue-900 font-bold">
          이제는 어학 연수가 아닌 DATA/AI 연수의 시대!
          <br />
          국내 최고 AI 기업에서 실무 프로젝트부터
          <br />
          실리콘밸리, 하버드에서 최신 기술과 글로벌 트렌드까지
          <br />
          취업에 필요한 모든 것을 최고에서 경험하세요.
        </p>

        {/* 버튼 */}
        <button className="mt-10 px-20 py-5 bg-black text-white font-bold text-2xl rounded-lg hover:bg-gray-900">
          100% 취업 보장받고 시작하기
        </button>
      </div>
      <StickyCard
        top={110}
        dDay={5}
        onCtaClick={() => {
          const el = document.getElementById("apply");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />
    </section>
  );
}
