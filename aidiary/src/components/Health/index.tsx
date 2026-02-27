import React, { useState } from "react";
import { motion } from "framer-motion";
import WeeklyContent from "./WeeklyContent";
import FetalMovementTracker from "./FetalMovementTracker";
import HealthMetrics from "./HealthMetrics";
import ContractionTimer from "./ContractionTimer";

type Tab = "weekly" | "fetal" | "metrics" | "contraction";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "weekly", label: "주차 정보", emoji: "🌱" },
  { id: "fetal", label: "태동 기록", emoji: "💗" },
  { id: "metrics", label: "건강 지표", emoji: "📊" },
  { id: "contraction", label: "수축 타이머", emoji: "⏱" },
];

const Health: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("weekly");
  const [mounted, setMounted] = useState<Set<Tab>>(new Set<Tab>(["weekly"]));

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setMounted((prev) => new Set<Tab>([...Array.from(prev), tab]));
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-[22px] font-display font-bold text-ink">
          건강 관리
        </h1>
        <p className="text-cocoa-muted text-[13px] mt-0.5">
          임신 중 건강을 꼼꼼히 기록해요
        </p>
      </div>

      {/* 서브탭 */}
      <div className="sticky top-12 z-30 bg-linen/95 backdrop-blur-sm px-5 py-3 border-b border-linen-deep">
        <div className="relative flex bg-linen-dark/60 rounded-2xl p-1 gap-0.5 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative shrink-0 flex-1 min-w-[72px] py-2.5 rounded-xl text-[11px] font-semibold transition-colors z-10 ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-cocoa-muted hover:text-cocoa"
              }`}
            >
              {activeTab === tab.id && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 bg-terra rounded-xl shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex flex-col items-center justify-center gap-0.5 leading-none">
                <span className="text-base leading-none">{tab.emoji}</span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠: 한 번 마운트된 탭은 숨김 처리(상태 유지), 전환 시 페이드 애니메이션 */}
      <div className="relative pb-28">
        {mounted.has("weekly") && (
          <motion.div
            key="weekly"
            animate={{ opacity: activeTab === "weekly" ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className={activeTab === "weekly" ? "block" : "hidden"}
          >
            <WeeklyContent />
          </motion.div>
        )}
        {mounted.has("fetal") && (
          <motion.div
            key="fetal"
            animate={{ opacity: activeTab === "fetal" ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className={activeTab === "fetal" ? "block" : "hidden"}
          >
            <FetalMovementTracker />
          </motion.div>
        )}
        {mounted.has("metrics") && (
          <motion.div
            key="metrics"
            animate={{ opacity: activeTab === "metrics" ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className={activeTab === "metrics" ? "block" : "hidden"}
          >
            <HealthMetrics />
          </motion.div>
        )}
        {mounted.has("contraction") && (
          <motion.div
            key="contraction"
            animate={{ opacity: activeTab === "contraction" ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className={activeTab === "contraction" ? "block" : "hidden"}
          >
            <ContractionTimer />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Health;
