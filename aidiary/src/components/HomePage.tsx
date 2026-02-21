import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PenLine, Baby } from "lucide-react";
import dayjs from "dayjs";
import { useAuthStore } from "../stores";
import { diaryApi, diaryAiApi } from "../api/client";
import type { DiaryEntry } from "../types";
import { EMOTION_COLORS, EMOTION_LABELS } from "../types";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo, characterData } = useAuthStore();
  const child = userInfo?.child;

  const [dailyPrompt, setDailyPrompt] = useState("");
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [recentEntries, setRecentEntries] = useState<DiaryEntry[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoadingPrompt(true);
    try {
      const [promptRes, diaryRes] = await Promise.allSettled([
        diaryAiApi.getDailyQuestion(),
        diaryApi.getAll(0, 2),
      ]);
      if (promptRes.status === "fulfilled")
        setDailyPrompt(promptRes.value.data.question);
      if (diaryRes.status === "fulfilled") {
        setRecentEntries(
          diaryRes.value.data.content.map((item: any) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            emotion: item.emotion || "calm",
            createdAt: item.createdAt,
          })),
        );
      }
    } catch (error) {
      console.error("홈 데이터 로드 실패:", error);
    } finally {
      setIsLoadingPrompt(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDday = () => {
    if (!child?.childBirthday) return null;
    const diff = dayjs(child.childBirthday).diff(dayjs(), "day");
    if (diff > 0) return `D-${diff}`;
    if (diff === 0) return "D-Day";
    return `D+${Math.abs(diff)}`;
  };
  const dday = getDday();

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="min-h-screen pb-28 px-5 pt-6 max-w-lg mx-auto"
    >
      {/* Greeting */}
      <motion.div variants={fadeUp} className="mb-8">
        <p className="text-cocoa-light text-[13px] tracking-wide font-body">
          {dayjs().format("YYYY년 M월 D일")}
        </p>
        <div className="flex items-end justify-between mt-1">
          <h1 className="text-[26px] font-display font-bold leading-tight text-ink">
            {child?.childName ? (
              <>
                {child.childName}
                <span className="text-terra">의</span> 하루
              </>
            ) : (
              <>
                오늘의 <span className="text-terra">이야기</span>
              </>
            )}
          </h1>
          {dday && <span className="stamp text-terra mb-1">{dday}</span>}
        </div>
      </motion.div>

      {/* Child character card */}
      {(child || characterData) && (
        <motion.div
          variants={fadeUp}
          onClick={() => navigate("/character")}
          className="mb-6 p-4 bg-white rounded-lg border border-linen-deep shadow-paper cursor-pointer hover:shadow-paper-hover transition-shadow relative"
        >
          <div className="flex items-center gap-4">
            {characterData?.characterImage ? (
              <img
                src={characterData.characterImage}
                alt={child?.childName || "우리 아이"}
                className="w-14 h-14 rounded-lg object-cover border border-linen-deep"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-linen-dark flex items-center justify-center border border-linen-deep">
                <Baby className="w-6 h-6 text-terra" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-ink text-[17px]">
                {child?.childName || "우리 아이"}
              </p>
              <p className="text-cocoa-muted text-xs mt-0.5">
                프로필 보기 &rarr;
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Daily prompt - styled like a torn-off note */}
      {dailyPrompt && (
        <motion.div
          variants={fadeUp}
          onClick={() => navigate("/diary")}
          className="mb-6 cursor-pointer group"
        >
          <div className="bg-white p-5 border border-linen-deep shadow-paper rounded-sm relative transform rotate-[0.3deg] hover:rotate-0 transition-transform">
            {/* Tape decoration */}
            <div className="absolute -top-1.5 left-6 w-16 h-3 bg-terra/10 rounded-[1px] transform -rotate-1" />
            <p className="text-[11px] font-bold tracking-widest text-terra uppercase mb-2">
              오늘의 질문
            </p>
            <p className="text-ink leading-relaxed font-display text-[15px]">
              {dailyPrompt}
            </p>
            <p className="text-[11px] text-cocoa-muted mt-3 group-hover:text-terra transition-colors">
              탭하여 일기 쓰러 가기 &rarr;
            </p>
          </div>
        </motion.div>
      )}

      {/* CTA buttons */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => navigate("/diary")}
          className="flex items-center gap-3 p-4 bg-white border border-linen-deep rounded-lg shadow-paper hover:shadow-paper-hover transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-md bg-terra/8 flex items-center justify-center shrink-0 group-hover:bg-terra/15 transition-colors">
            <PenLine className="w-[18px] h-[18px] text-terra" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-ink">일기 쓰기</p>
            <p className="text-[11px] text-cocoa-muted">오늘을 기록해요</p>
          </div>
        </button>
        <button
          onClick={() => navigate("/character")}
          className="flex items-center gap-3 p-4 bg-white border border-linen-deep rounded-lg shadow-paper hover:shadow-paper-hover transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-md bg-sage/10 flex items-center justify-center shrink-0 group-hover:bg-sage/20 transition-colors">
            <Baby className="w-[18px] h-[18px] text-sage-dark" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-ink">아이 만나기</p>
            <p className="text-[11px] text-cocoa-muted">캐릭터 만들기</p>
          </div>
        </button>
      </motion.div>

      {/* Recent diary entries */}
      {recentEntries.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[15px] font-display font-bold text-ink">
              최근 일기
            </h2>
            <button
              onClick={() => navigate("/diary")}
              className="text-[12px] text-terra hover:underline underline-offset-2"
            >
              전체보기
            </button>
          </div>

          <div className="space-y-3">
            {recentEntries.map((entry, i) => (
              <div
                key={entry.id}
                onClick={() => navigate("/diary")}
                className="p-4 bg-white border border-linen-deep rounded-lg shadow-paper cursor-pointer hover:shadow-paper-hover transition-shadow"
                style={{ transform: `rotate(${i % 2 === 0 ? -0.3 : 0.3}deg)` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="stamp"
                    style={{
                      color:
                        EMOTION_COLORS[entry.emotion] || EMOTION_COLORS.calm,
                    }}
                  >
                    {EMOTION_LABELS[entry.emotion] || "평온"}
                  </span>
                  <span className="text-[11px] text-cocoa-muted">
                    {dayjs(entry.createdAt).format("M월 D일")}
                  </span>
                </div>
                <p className="text-cocoa text-[14px] line-clamp-2 leading-relaxed">
                  {entry.content}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HomePage;
