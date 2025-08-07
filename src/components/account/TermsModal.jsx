import React from "react";

export default function TermsModal({ isOpen, onClose, modalType }) {
  if (!isOpen) return null;

  // 모달 전문 내용
  const content = {
    service: {
      title: "서비스 약관",
      body: (
        <>
          <div className="mb-4 text-sm leading-relaxed">
            {/* 여기에 서비스 약관 전문을 넣으세요 */}
            <div className="p-2">
              <div className="font-bold underline">
                <p>동철코딩의 모든 서비스는</p>
                <p>
                  동현 민철이 좋은곳으로 취직하기 위함을 목적으로 제공됩니다.
                </p>
              </div>
              <div className="mt-4">
                <p className="font-bold">제 1 장: 총칙</p>
                <p className="mt-1">
                  제1조 (본 약관의 목적) 본 서비스 이용약관(이하 "본 약관"이라
                  합니다)은 어쩌고 저쩌고 블라 블라 블라 블라 어절씨구 저절씨구
                  신난다.
                </p>
                <p>
                  제2조 (용어의 정의) 본 약관에서 명시하고 있는 주요 용어의
                  정의는 다음과 같습니다. 프론트엔드도 한땀 한땀 참 쉽지 않구나,
                  그래도 해내면 그만이다. 화이팅 하자.
                </p>
                <p>
                  제3조 (본 약관의 게시와 개정) 회사는 회원이 본 약관의 내용을
                  쉽게 알 수 있도록 플랫폼의 초기화면에 게시하거나 연결화면을
                  통해 볼 수 있도록 조치합니다. 결론은 동철 코딩 화이팅
                </p>
              </div>
              <div className="mt-4">
                <p className="font-bold">
                  제 2 장: 서비스 이용계약의 체결 및 회원의 정보 수집, 보호
                  제5조 (서비스 이용계약 등)
                </p>
                <p className="mt-1">
                  제1조 (본 약관의 목적) 본 서비스 이용약관(이하 "본 약관"이라
                  합니다)은 어쩌고 저쩌고 블라 블라 블라 블라 어절씨구 저절씨구
                  신난다.
                </p>
                <p>
                  제2조 (용어의 정의) 본 약관에서 명시하고 있는 주요 용어의
                  정의는 다음과 같습니다. 프론트엔드도 한땀 한땀 참 쉽지 않구나,
                  그래도 해내면 그만이다. 화이팅 하자.
                </p>
                <p>
                  제3조 (본 약관의 게시와 개정) 회사는 회원이 본 약관의 내용을
                  쉽게 알 수 있도록 플랫폼의 초기화면에 게시하거나 연결화면을
                  통해 볼 수 있도록 조치합니다. 결론은 동철 코딩 화이팅
                </p>
              </div>
            </div>
          </div>
        </>
      ),
    },
    privacy: {
      title: "개인정보 처리 방침 및 제3자 제공 동의",
      body: (
        <>
          <div className="mb-4 text-sm leading-relaxed">
            {/* 여기에 서비스 약관 전문을 넣으세요 */}
            <div className="p-2">
              <div className="font-bold underline">
                <p>동철코딩의 모든 서비스는</p>
                <p>
                  동현 민철이 좋은곳으로 취직하기 위함을 목적으로 제공됩니다.
                </p>
              </div>
              <div className="mt-4">
                <p className="font-bold">[1] 개인정보의 처리목적</p>
                <p className="mt-1">1. 당신은 낚였습니다.</p>
                <p>
                  2. 당신의 개인 정보는 동철코딩에서 유용하게 잘 사용하도록
                  하겠습니다.
                </p>
              </div>
              <div className="mt-4">
                <p className="font-bold">[2] 개인정보의 처리 및 보유기간</p>
                <p className="mt-1">
                  1. 동철코딩에 제공된 개인정보는 동현 민철이 취직을 하여 더
                  이상 동철코딩 서비스가 제공되지 않아도 될 때까지 잘 보관하도록
                  하겠습니다.
                </p>
                <p>2. 불안하다면 빠르게 탈퇴하는 것을 권장합니다.</p>
              </div>
            </div>
          </div>
        </>
      ),
    },
  };

  const { title, body } = content[modalType] || {};

  return (
    <div
      className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="border border-gray-200 bg-white rounded-lg p-6 max-w-lg w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
          aria-label="닫기"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="overflow-y-auto max-h-[60vh]">{body}</div>
      </div>
    </div>
  );
}
