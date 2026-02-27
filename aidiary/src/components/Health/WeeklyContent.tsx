import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Lightbulb, Heart, Sprout } from "lucide-react";
import { pregnancyApi } from "../../api/client";
import type { PregnancyWeekInfo } from "../../types";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

// 원형 진행 아크 컴포넌트
const ProgressArc: React.FC<{ week: number }> = ({ week }) => {
  const pct = week / 42;
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const trimester = week <= 13 ? 1 : week <= 27 ? 2 : 3;
  const trimColors = ["", "#C67D5B", "#8FA68A", "#C9A0A0"];

  return (
    <div className="relative flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* 배경 트랙 */}
        <circle cx="60" cy="60" r={r} fill="none" stroke="#E2D9CC" strokeWidth="8" />
        {/* 진행 아크 */}
        <motion.circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={trimColors[trimester]}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute text-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-3xl font-display font-bold text-ink leading-none"
        >
          {week}
        </motion.p>
        <p className="text-[11px] text-cocoa-muted mt-0.5">주차</p>
      </div>
    </div>
  );
};

// 분기 도트 타임라인
const TrimesterTimeline: React.FC<{ week: number }> = ({ week }) => {
  const markers = [
    { week: 1, label: "1주" },
    { week: 13, label: "1분기" },
    { week: 27, label: "2분기" },
    { week: 42, label: "출산" },
  ];
  return (
    <div className="relative flex items-center justify-between px-2">
      <div className="absolute left-2 right-2 top-2 h-0.5 bg-linen-deep" />
      <motion.div
        className="absolute left-2 top-2 h-0.5 bg-terra rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((week / 42) * 100, 100)}%` }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
      />
      {markers.map((m) => (
        <div key={m.week} className="relative flex flex-col items-center gap-1.5 z-10">
          <div
            className={`w-4 h-4 rounded-full border-2 transition-colors ${
              week >= m.week
                ? "bg-terra border-terra"
                : "bg-linen border-linen-deep"
            }`}
          />
          <span className="text-[10px] text-cocoa-muted whitespace-nowrap">{m.label}</span>
        </div>
      ))}
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white/60 rounded-2xl p-4 border border-linen-deep animate-pulse">
    <div className="h-3 w-20 bg-linen-deep rounded mb-3" />
    <div className="h-4 w-full bg-linen-dark rounded mb-2" />
    <div className="h-4 w-3/4 bg-linen-dark rounded" />
  </div>
);

const WeeklyContent: React.FC = () => {
  const [weekData, setWeekData] = useState<PregnancyWeekInfo | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(20);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    loadCurrentWeek();
  }, []);

  const loadCurrentWeek = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pregnancyApi.getCurrentWeek();
      setWeekData(res.data);
      setCurrentWeek(res.data.week);
    } catch {
      setError("임신 주차 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadWeek = async (week: number, dir: 1 | -1) => {
    if (week < 1 || week > 42 || navigating) return;
    setDirection(dir);
    setNavigating(true);
    try {
      const res = await pregnancyApi.getWeek(week);
      setWeekData(res.data);
      setCurrentWeek(week);
    } catch {
    } finally {
      setNavigating(false);
    }
  };

  if (loading) {
    return (
      <div className="px-5 pt-4 space-y-3">
        <div className="flex justify-center py-4">
          <div className="w-[120px] h-[120px] rounded-full bg-linen-dark animate-pulse" />
        </div>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !weekData) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-4xl mb-3">🌿</p>
        <p className="text-ink font-display font-bold text-lg mb-1">
          주차 정보를 불러올 수 없어요
        </p>
        <p className="text-cocoa-muted text-sm mb-4">
          프로필에서 출산 예정일을 설정하면<br />현재 임신 주차를 자동으로 계산해요
        </p>
        <button
          onClick={loadCurrentWeek}
          className="px-5 py-2.5 bg-terra text-white rounded-xl text-sm font-semibold"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const trimester = currentWeek <= 13 ? "임신 초기" : currentWeek <= 27 ? "임신 중기" : "임신 후기";

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="px-5 pt-4 space-y-4"
    >
      {/* 주차 원형 + 네비게이션 */}
      <motion.div
        variants={fadeUp}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-paper border border-white/50"
      >
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => loadWeek(currentWeek - 1, -1)}
            disabled={currentWeek <= 1 || navigating}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-linen-deep text-cocoa-muted disabled:opacity-30 hover:bg-linen-dark hover:text-cocoa transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentWeek}
              initial={{ opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -20 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-1"
            >
              <ProgressArc week={currentWeek} />
              <div className="text-center mt-1">
                <span className="stamp text-terra text-[10px]">{trimester}</span>
              </div>
            </motion.div>
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => loadWeek(currentWeek + 1, 1)}
            disabled={currentWeek >= 42 || navigating}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-linen-deep text-cocoa-muted disabled:opacity-30 hover:bg-linen-dark hover:text-cocoa transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* 분기 타임라인 */}
        <div className="mt-5">
          <TrimesterTimeline week={currentWeek} />
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentWeek}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {/* 아기 크기 */}
          <motion.div
            variants={fadeUp}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-paper border border-white/50"
          >
            <div className="flex items-center gap-3">
              <div className="text-4xl w-14 h-14 flex items-center justify-center bg-linen-dark rounded-xl shrink-0">
                {getBabyEmoji(currentWeek)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold tracking-widest text-terra uppercase mb-1">
                  이번 주 아기 크기
                </p>
                <p className="text-[17px] font-display font-bold text-ink">
                  {weekData.babySize} 정도
                </p>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-cocoa-muted">키 {weekData.babySizeCm}</span>
                  <span className="text-xs text-cocoa-muted">·</span>
                  <span className="text-xs text-cocoa-muted">몸무게 {weekData.babyWeightG}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 태아 발달 */}
          <motion.div
            variants={fadeUp}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-paper border border-white/50 overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-terra rounded-l-2xl" />
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-terra/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sprout className="w-4 h-4 text-terra" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold tracking-widest text-terra uppercase mb-1.5">
                  태아 발달
                </p>
                <p className="text-[14px] text-cocoa leading-relaxed">
                  {weekData.development}
                </p>
              </div>
            </div>
          </motion.div>

          {/* 산모 변화 */}
          <motion.div
            variants={fadeUp}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-paper border border-white/50 overflow-hidden relative"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-sage rounded-l-2xl" />
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sage/15 flex items-center justify-center shrink-0 mt-0.5">
                <Heart className="w-4 h-4 text-sage-dark" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold tracking-widest text-sage-dark uppercase mb-1.5">
                  엄마 몸의 변화
                </p>
                <p className="text-[14px] text-cocoa leading-relaxed">
                  {weekData.maternalChanges}
                </p>
              </div>
            </div>
          </motion.div>

          {/* 이번 주 팁 */}
          <motion.div
            variants={fadeUp}
            className="bg-gradient-to-br from-[#FFF9E6]/90 to-[#FFF3D0]/90 rounded-2xl p-4 border border-[#F0E4B8]/70 overflow-hidden relative"
          >
            {/* 테이프 장식 */}
            <div className="absolute -top-1.5 left-6 w-14 h-3 bg-terra/15 rounded-[1px] transform -rotate-1" />
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4 text-[#C9A000]" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold tracking-widest text-[#C9A000] uppercase mb-1.5">
                  이번 주 팁
                </p>
                <p className="text-[14px] text-cocoa leading-relaxed">
                  {weekData.tip}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

function getBabyEmoji(week: number): string {
  if (week <= 4) return "🌱";
  if (week <= 6) return "🫐";
  if (week <= 8) return "🍓";
  if (week <= 10) return "🍊";
  if (week <= 12) return "🍋";
  if (week <= 14) return "🍑";
  if (week <= 16) return "🥑";
  if (week <= 18) return "🥭";
  if (week <= 20) return "🍌";
  if (week <= 22) return "🌽";
  if (week <= 24) return "🥕";
  if (week <= 26) return "🍆";
  if (week <= 28) return "🥦";
  if (week <= 30) return "🍍";
  if (week <= 32) return "🥥";
  if (week <= 36) return "🍈";
  return "🍉";
}

export default WeeklyContent;
