import React, { useState } from "react";
import PersonalityTest from "./PersonalityTest";
import { usePersonalityGenerator } from "../hooks/usePersonalityGenerator";
import CommonButton from "./common/CommonButton";
import GlassCard from "./common/GlassCard";

interface CharacterPersonalityBuilderProps {
  onPersonalityGenerated: (summary: string) => void;
}

const subColor = "#C67D5B";

const CharacterPersonalityBuilder: React.FC<
  CharacterPersonalityBuilderProps
> = ({ onPersonalityGenerated }) => {
  const [parent1Result, setParent1Result] = useState<string | null>(null);
  const [parent2Result, setParent2Result] = useState<string | null>(null);

  const {
    generatePersonality, loading, generatedPersonality, markdownBody, getField,
  } = usePersonalityGenerator(onPersonalityGenerated);

  const handleGenerate = () => {
    if (parent1Result && parent2Result) generatePersonality(parent1Result, parent2Result);
  };

  return (
    <div className="min-h-screen py-6 px-4 flex justify-center bg-linen">
      <GlassCard subColor={subColor}>
        <h2 className="text-[20px] font-display font-bold text-center text-ink mb-2">
          부모 성격을 기반으로<br />아이 성격 만들기
        </h2>
        <p className="text-center text-cocoa-muted text-[13px] mb-6">
          두 사람의 마음을 담아 아이의 성격을 상상해보세요
        </p>

        <PersonalityTest parentLabel="부모 1" onSubmit={setParent1Result} />
        <hr className="my-6 border-linen-deep" />
        <PersonalityTest parentLabel="부모 2" onSubmit={setParent2Result} />

        <div className="text-center mt-6">
          <CommonButton loading={loading} disabled={!parent1Result || !parent2Result} onClick={handleGenerate} subColor={subColor}>
            아이 성격 생성하기
          </CommonButton>
        </div>

        {generatedPersonality && (
          <div className="mt-6 p-5 bg-white border border-linen-deep rounded-lg shadow-paper">
            <h3 className="text-[16px] font-display font-bold text-ink mb-3">
              생성된 아이 성격
            </h3>

            <p className="text-[12px] font-bold text-terra tracking-wide uppercase mb-2">키워드</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {getField("성격 키워드", markdownBody).split("\n").map((kw, i) => (
                <span key={i} className="stamp text-terra">
                  {kw.replace(/^-/, "").trim()}
                </span>
              ))}
            </div>

            <p className="text-[12px] font-bold text-sage-dark tracking-wide uppercase mb-2">설명</p>
            <p className="text-cocoa text-[14px] leading-relaxed whitespace-pre-line">
              {getField("간단한 성격 설명", markdownBody)}
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default CharacterPersonalityBuilder;
