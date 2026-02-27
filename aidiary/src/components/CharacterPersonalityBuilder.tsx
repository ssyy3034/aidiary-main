import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { personalityApi } from "../api/client";
import { usePersonality } from "./PersonalityContext";
import { usePersonalityChat } from "../hooks/usePersonalityChat";
import GlassCard from "./common/GlassCard";

interface CharacterPersonalityBuilderProps {
  onPersonalityGenerated: (summary: string) => void;
}

const subColor = "#C67D5B";

// ─── Mini Chat UI ──────────────────────────────────────────────────────────────
interface ChatPanelProps {
  parentLabel: string;
  onComplete: (history: { role: string; content: string }[]) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ parentLabel, onComplete }) => {
  const { messages, isLoading, isComplete, startInterview, sendMessage } =
    usePersonalityChat(parentLabel);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [notified, setNotified] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!started) {
      setStarted(true);
      startInterview();
    }
  }, [started, startInterview]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isComplete && !notified) {
      setNotified(true);
      const history = messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));
      setTimeout(() => onComplete(history), 1200);
    }
  }, [isComplete, notified, messages, onComplete]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isComplete) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <p className="text-[13px] font-bold text-terra mb-3">{parentLabel} 인터뷰</p>

      {/* Message list */}
      <div
        className="max-h-[320px] overflow-y-auto mb-3 p-4 rounded-3xl min-h-[160px] flex flex-col gap-3 backdrop-blur-md border border-white/20"
        style={{
          backgroundColor: "rgba(255,255,255,0.6)",
          boxShadow: "0 8px 32px rgba(60,46,36,0.05)",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`w-fit max-w-[85%] px-4 py-3 text-[14px] leading-relaxed shadow-sm ${
              msg.role === "user"
                ? "self-end rounded-[20px_20px_4px_20px] bg-[#C67D5B] text-white"
                : "self-start rounded-[20px_20px_20px_4px] bg-[#F7F3ED] text-[#5C4033] border border-[#E2D9CC]/50"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {isLoading && (
          <div
            className="self-start w-fit px-4 py-3 rounded-[20px_20px_20px_4px] bg-[#F7F3ED] border border-[#E2D9CC]/50"
            style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.05)" }}
          >
            <p className="text-[11px] text-[#9C8A7A] mb-1">생각 중이에요...</p>
            <div className="flex gap-1.5 items-center">
              <div className="w-2 h-2 rounded-full bg-[#C67D5B] opacity-60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-[#C67D5B] opacity-80 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-[#C67D5B] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {isComplete && (
          <div className="self-center text-[12px] text-sage-dark bg-sage/10 px-4 py-2 rounded-full border border-sage/30 mt-1">
            ✓ 인터뷰 완료! 다음 단계로 이동 중...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isComplete && (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="답변을 입력하세요..."
            className="flex-1 px-4 py-3 rounded-full bg-white/70 backdrop-blur-sm border border-terra/30 transition-all focus:outline-none focus:ring-4 focus:ring-terra/20 focus:border-terra disabled:opacity-50 text-[14px] text-cocoa"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 rounded-full text-white font-bold transition-all hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 bg-terra"
          >
            {isLoading ? (
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            ) : (
              "전송"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Result View ───────────────────────────────────────────────────────────────
const extractMarkdownContent = (text: string): string => {
  const match = text.match(/```markdown([\s\S]*?)```/i);
  return match ? match[1].trim() : text;
};

const getField = (field: string, markdown: string): string => {
  const emojiMap: Record<string, string> = {
    "유전적 성격 경향": "🧬",
    "성격 키워드": "✨",
    "간단한 성격 설명": "🧠",
    "아이 성격 발달 예측": "🌱",
  };
  const emoji = emojiMap[field] ?? "";
  const pattern = `##\\s*${emoji}\\s*${field}\\s*[\\n\\r]+([\\s\\S]*?)(?=\\n##|$)`;
  const regex = new RegExp(pattern, "i");
  const match = markdown.match(regex);
  return match ? match[1].trim() : "";
};

// ─── Main Component ────────────────────────────────────────────────────────────
const CharacterPersonalityBuilder: React.FC<CharacterPersonalityBuilderProps> = ({
  onPersonalityGenerated,
}) => {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [parent1History, setParent1History] = useState<{ role: string; content: string }[]>([]);
  const [profile, setProfile] = useState<string>("");
  const [synthesizing, setSynthesizing] = useState(false);
  const { setPersonality } = usePersonality();
  const navigate = useNavigate();

  const handleParent1Complete = (history: { role: string; content: string }[]) => {
    setParent1History(history);
    setStep(2);
  };

  const handleParent2Complete = async (history: { role: string; content: string }[]) => {
    setSynthesizing(true);
    setStep(3);
    try {
      const res = await personalityApi.synthesize({
        parent1_history: parent1History,
        parent2_history: history,
      });
      const profileText: string = res.data.personality_profile;
      setProfile(profileText);
      setPersonality(profileText);
      onPersonalityGenerated(profileText);
    } catch (e) {
      console.error("Synthesize failed", e);
    } finally {
      setSynthesizing(false);
    }
  };

  const handleGoToCharacter = () => {
    navigate("/character");
  };

  const markdownBody = extractMarkdownContent(profile);

  return (
    <div className="min-h-screen py-6 px-4 flex justify-center bg-linen">
      <GlassCard subColor={subColor}>
        {/* Step 0: Intro */}
        {step === 0 && (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🧬</div>
            <h2 className="text-[20px] font-display font-bold text-ink mb-3">
              부모의 성격을<br />대화로 알아볼게요
            </h2>
            <p className="text-cocoa-muted text-[13px] mb-2 leading-relaxed">
              Big Five(OCEAN) 모델을 기반으로<br />
              부모 두 분과 자연스러운 대화를 나눕니다.
            </p>
            <p className="text-cocoa-muted text-[12px] mb-8 leading-relaxed">
              각 인터뷰는 12~15턴 정도 진행되며,<br />
              완료 후 아이 성격을 함께 예측해 드려요 💕
            </p>
            <button
              onClick={() => setStep(1)}
              className="px-8 py-3.5 rounded-full text-white font-bold bg-terra hover:bg-terra-dark transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              시작하기
            </button>
          </div>
        )}

        {/* Step 1: Parent 1 chat */}
        {step === 1 && (
          <div>
            <h2 className="text-[18px] font-display font-bold text-ink mb-1 text-center">
              부모 1 인터뷰
            </h2>
            <p className="text-center text-cocoa-muted text-[12px] mb-5">
              AI와 자연스럽게 대화해주세요
            </p>
            <ChatPanel parentLabel="부모 1" onComplete={handleParent1Complete} />
          </div>
        )}

        {/* Step 2: Parent 2 chat */}
        {step === 2 && (
          <div>
            <h2 className="text-[18px] font-display font-bold text-ink mb-1 text-center">
              부모 2 인터뷰
            </h2>
            <p className="text-center text-cocoa-muted text-[12px] mb-5">
              이번에는 다른 분이 대화해주세요
            </p>
            <ChatPanel parentLabel="부모 2" onComplete={handleParent2Complete} />
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && (
          <div>
            <h2 className="text-[18px] font-display font-bold text-ink mb-4 text-center">
              아이 성격 예측 결과
            </h2>

            {synthesizing ? (
              <div className="text-center py-10">
                <div className="flex gap-2 justify-center mb-3">
                  <div className="w-3 h-3 rounded-full bg-terra animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-3 h-3 rounded-full bg-terra animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-3 h-3 rounded-full bg-terra animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <p className="text-cocoa-muted text-[13px]">두 분의 이야기를 분석 중이에요...</p>
              </div>
            ) : profile ? (
              <div className="space-y-4">
                {/* Keywords */}
                <div className="p-4 bg-white/80 border border-linen-deep rounded-2xl shadow-paper">
                  <p className="text-[11px] font-bold text-terra tracking-widest uppercase mb-2">
                    ✨ 성격 키워드
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {getField("성격 키워드", markdownBody)
                      .split("\n")
                      .filter((kw) => kw.trim())
                      .map((kw, i) => (
                        <span key={i} className="stamp text-terra">
                          {kw.replace(/^-/, "").trim()}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 bg-white/80 border border-linen-deep rounded-2xl shadow-paper">
                  <p className="text-[11px] font-bold text-sage-dark tracking-widest uppercase mb-2">
                    🧠 간단한 성격 설명
                  </p>
                  <p className="text-cocoa text-[13px] leading-relaxed whitespace-pre-line">
                    {getField("간단한 성격 설명", markdownBody)}
                  </p>
                </div>

                {/* Genetic tendency */}
                <div className="p-4 bg-white/80 border border-linen-deep rounded-2xl shadow-paper">
                  <p className="text-[11px] font-bold text-cocoa-muted tracking-widest uppercase mb-2">
                    🧬 유전적 성격 경향
                  </p>
                  <p className="text-cocoa text-[13px] leading-relaxed whitespace-pre-line">
                    {getField("유전적 성격 경향", markdownBody)}
                  </p>
                </div>

                {/* Development prediction */}
                <div className="p-4 bg-white/80 border border-linen-deep rounded-2xl shadow-paper">
                  <p className="text-[11px] font-bold text-cocoa-muted tracking-widest uppercase mb-2">
                    🌱 아이 성격 발달 예측
                  </p>
                  <p className="text-cocoa text-[13px] leading-relaxed whitespace-pre-line">
                    {getField("아이 성격 발달 예측", markdownBody)}
                  </p>
                </div>

                <button
                  onClick={handleGoToCharacter}
                  className="w-full mt-2 py-3.5 rounded-full text-white font-bold bg-terra hover:bg-terra-dark transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  캐릭터 만들러 가기 →
                </button>
              </div>
            ) : (
              <p className="text-center text-cocoa-muted text-[13px]">결과를 불러오지 못했어요.</p>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default CharacterPersonalityBuilder;
