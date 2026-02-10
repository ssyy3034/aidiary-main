import { useState } from "react";
import axios from "axios";
import { usePersonality } from "../components/PersonalityContext";
import { useNavigate } from "react-router-dom";

interface UsePersonalityGeneratorReturn {
  generatePersonality: (
    parent1Result: string,
    parent2Result: string,
  ) => Promise<void>;
  loading: boolean;
  generatedPersonality: string;
  markdownBody: string;
  getField: (field: string, markdown: string) => string;
}

export const usePersonalityGenerator = (
  onPersonalityGenerated: (summary: string) => void,
): UsePersonalityGeneratorReturn => {
  const [loading, setLoading] = useState(false);
  const [generatedPersonality, setGeneratedPersonality] = useState<string>("");
  const { setPersonality } = usePersonality();
  const navigate = useNavigate();

  const generatePersonality = async (
    parent1Result: string,
    parent2Result: string,
  ) => {
    if (!parent1Result || !parent2Result) return;

    setLoading(true);
    try {
      const prompt = `다음은 부모 두 사람의 성격 테스트 결과입니다.\n\n부모1:\n${parent1Result}\n\n부모2:\n${parent2Result}\n\n당신은 유전심리학 기반의 성격 분석 전문가입니다. 부모의 성격적 특성과 조합을 바탕으로 가상의 아이 성격을 아래 형식에 맞춰 분석해주세요.\n\n응답은 반드시 아래 마크다운 문법을 따르세요:\n\n\`\`\`markdown\n## 🧬 유전적 성격 경향\n- ...\n## ✨ 성격 키워드\n- 키워드1\n- 키워드2\n- 키워드3\n## 🧠 간단한 성격 설명\n...\n\`\`\``;

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "당신은 성격 분석 및 조합을 전문으로 하는 AI입니다.",
            },
            { role: "user", content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      const resultText = response.data.choices[0].message.content;
      setGeneratedPersonality(resultText);
      setPersonality(resultText); // 전역 상태 저장
      onPersonalityGenerated(resultText);

      // ✅ 생성 완료 후 캐릭터 생성 페이지로 이동
      setTimeout(() => {
        navigate("/character");
      }, 100);
    } catch (error) {
      console.error("GPT 요청 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 마크다운 블록 내부 추출
  const extractMarkdownContent = (text: string): string => {
    const match = text.match(/```markdown([\s\S]*?)```/i);
    return match ? match[1].trim() : text;
  };

  // 마크다운 섹션별 필드 추출
  const getField = (field: string, markdown: string): string => {
    const emojiMap: Record<string, string> = {
      "유전적 성격 경향": "🧬",
      "성격 키워드": "✨",
      "간단한 성격 설명": "🧠",
    };
    const emoji = emojiMap[field] ?? "";
    const pattern = `##\\s*${emoji}\\s*${field}\\s*[\\n\\r]+([\\s\\S]*?)(?=\\n##|$)`;
    const regex = new RegExp(pattern, "i");
    const match = markdown.match(regex);
    return match ? match[1].trim() : "";
  };

  const markdownBody = extractMarkdownContent(generatedPersonality);

  return {
    generatePersonality,
    loading,
    generatedPersonality,
    markdownBody,
    getField,
  };
};
