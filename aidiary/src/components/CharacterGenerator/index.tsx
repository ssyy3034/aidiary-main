import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChildInfoForm from "./ChildInfoForm";
import ParentImageUpload from "./ParentImageUpload";
import CharacterDisplay from "./CharacterDisplay";
import CharacterChat from "./CharacterChat";
import useCharacter from "../../hooks/useCharacter";
import { usePersonality } from "../PersonalityContext";
import { useAuthStore } from "../../stores";
import type { CharacterData } from "../../types";
import "./CharacterGenerator.css";

interface CharacterGeneratorProps {
  onCharacterCreated: (characterData: CharacterData) => Promise<void>;
}

const CharacterGenerator: React.FC<CharacterGeneratorProps> = ({
  onCharacterCreated,
}) => {
  const navigate = useNavigate();
  const { personality } = usePersonality();
  const { hasCharacter } = useAuthStore();
  const [parent1File, setParent1File] = useState<File | null>(null);
  const [parent2File, setParent2File] = useState<File | null>(null);

  // 캐릭터가 없고 성격 분석도 안 했으면 인터뷰 먼저
  useEffect(() => {
    if (!hasCharacter && !personality) {
      navigate("/character-personality", { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    generatedImage, isLoading, status, messages,
    childName, childBirthday, setChildName, setChildBirthday,
    generateCharacter, sendMessage, setStatus,
  } = useCharacter(onCharacterCreated);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName || !childBirthday || !parent1File || !parent2File) {
      setStatus("모든 필드를 입력해주세요.");
      return;
    }
    await generateCharacter(parent1File, parent2File, personality || "");
  };

  return (
    <div className="w-full max-w-lg mx-auto px-5 animate-fade-in pb-28 pt-4">
      <div className="mb-6">
        <h1 className="text-[24px] font-display font-bold text-ink mb-1">
          우리 아이 만들기
        </h1>
        <p className="text-cocoa-muted text-[13px]">
          부모님의 사진으로 미래의 아이 모습을 만나보세요
        </p>
      </div>

      <div className="bg-white border border-linen-deep rounded-lg shadow-paper p-5 md:p-7">
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
              className="w-full py-3.5 rounded-md text-white text-[15px] font-bold tracking-wide bg-terra hover:bg-terra-dark transition-colors shadow-paper disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  분석 중...
                </>
              ) : (
                "우리 아이 만나보기"
              )}
            </button>
          </form>
        )}

        {generatedImage && (
          <>
            <CharacterDisplay childName={childName} childBirthday={childBirthday} imageUrl={generatedImage} />
            <CharacterChat messages={messages} onSendMessage={sendMessage} />
          </>
        )}

        {status && (
          <p className="mt-4 text-center text-[13px] font-bold text-terra bg-terra/5 py-2 rounded-md">
            {status}
          </p>
        )}
      </div>
    </div>
  );
};

export default CharacterGenerator;
