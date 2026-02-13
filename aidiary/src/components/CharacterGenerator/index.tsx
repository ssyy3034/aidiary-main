import React, { useState } from "react";
import ChildInfoForm from "./ChildInfoForm";
import ParentImageUpload from "./ParentImageUpload";
import CharacterDisplay from "./CharacterDisplay";
import CharacterChat from "./CharacterChat";
import useCharacter from "../../hooks/useCharacter";
import { usePersonality } from "../PersonalityContext";
import type { CharacterData } from "../../types";
import "./CharacterGenerator.css";

interface CharacterGeneratorProps {
  onCharacterCreated: (characterData: CharacterData) => Promise<void>;
}

/**
 * 캐릭터 생성기 메인 컴포넌트
 * - Tailwind CSS 리팩토링
 */
const CharacterGenerator: React.FC<CharacterGeneratorProps> = ({
  onCharacterCreated,
}) => {
  const { personality } = usePersonality();

  // 파일 상태 (로컬)
  const [parent1File, setParent1File] = useState<File | null>(null);
  const [parent2File, setParent2File] = useState<File | null>(null);

  // 커스텀 훅 (Refactored: existingCharacter prop 제거)
  const {
    generatedImage,
    isLoading,
    status,
    messages,
    childName,
    childBirthday,
    setChildName,
    setChildBirthday,
    generateCharacter,
    sendMessage,
    setStatus,
  } = useCharacter(onCharacterCreated);

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!childName || !childBirthday || !parent1File || !parent2File) {
      setStatus("모든 필드를 입력해주세요.");
      return;
    }

    await generateCharacter(parent1File, parent2File, personality || "");
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 px-4 animate-fade-in pb-20">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-ink mb-2">
          우리 아이 캐릭터 만들기
        </h1>
        <p className="text-ink-light">
          부모님의 사진으로 미래의 아이 모습을 만나보세요
        </p>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-sand rounded-[32px] shadow-card p-6 md:p-8 transition-all duration-300 hover:shadow-float">
        {/* 캐릭터 생성 전: 입력 폼 */}
        {!generatedImage && (
          <form onSubmit={handleSubmit}>
            <ChildInfoForm
              childName={childName}
              childBirthday={childBirthday}
              onNameChange={setChildName}
              onBirthdayChange={setChildBirthday}
              disabled={isLoading}
            />

            <ParentImageUpload
              parent1File={parent1File}
              parent2File={parent2File}
              onParent1Change={setParent1File}
              onParent2Change={setParent2File}
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl text-white text-lg font-medium transition-all duration-300 bg-primary hover:bg-primary-dark shadow-soft hover:shadow-float disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  분석 중...
                </>
              ) : (
                "우리 아이 만나보기"
              )}
            </button>
          </form>
        )}

        {/* 캐릭터 생성 후: 캐릭터 표시 + 채팅 */}
        {generatedImage && (
          <>
            <CharacterDisplay
              childName={childName}
              childBirthday={childBirthday}
              imageUrl={generatedImage}
            />

            <CharacterChat messages={messages} onSendMessage={sendMessage} />
          </>
        )}

        {/* 상태 메시지 */}
        {status && (
          <p className="mt-4 text-center font-medium text-primary bg-primary/5 py-2 rounded-lg">
            {status}
          </p>
        )}
      </div>
    </div>
  );
};

export default CharacterGenerator;
