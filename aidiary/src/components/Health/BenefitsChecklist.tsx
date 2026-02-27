import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { benefitsApi, pregnancyApi } from "../../api/client";
import { BenefitDTO } from "../../types";
import { Check, Gift } from "lucide-react";

export const BenefitsChecklist: React.FC = () => {
  const [benefits, setBenefits] = useState<BenefitDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<number>(0);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        // GET Current Week
        const weekRes = await pregnancyApi.getCurrentWeek();
        const week = weekRes.data?.week || 1;
        setCurrentWeek(week);

        // GET Benefits list for that week
        const benefitsRes = await benefitsApi.getBenefits(week);
        if (benefitsRes.data) {
          setBenefits(benefitsRes.data);
        }
      } catch (error) {
        console.error("Failed to load benefits data", error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleToggleCheck = async (benefitId: number) => {
    try {
      // Optimistic Update
      setBenefits((prev) =>
        prev.map((b) =>
          b.id === benefitId ? { ...b, completed: !b.completed } : b,
        ),
      );
      // API Call
      await benefitsApi.toggleCheck(benefitId);
    } catch (error) {
      console.error("Failed to toggle benefit check", error);
      // Revert Optimistic Update
      setBenefits((prev) =>
        prev.map((b) =>
          b.id === benefitId ? { ...b, completed: !b.completed } : b,
        ),
      );
    }
  };

  const progress = useMemo(() => {
    if (benefits.length === 0) return 0;
    const completed = benefits.filter((b) => b.completed).length;
    return Math.round((completed / benefits.length) * 100);
  }, [benefits]);

  const completedCount = benefits.filter((b) => b.completed).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-terra/20 border-t-terra rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto py-2 pb-10">
      {/* Progress Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-linen-deep">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-ink mb-1">
              놓치지 말아야 할 행정 지원금
            </h2>
            <p className="text-sm text-cocoa-muted tracking-tight">
              {currentWeek}주차 산모님을 위한 필수 혜택을 모아두었어요.
            </p>
          </div>
          <div className="w-12 h-12 bg-terra/10 rounded-2xl flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-terra" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-semibold text-terra">달성도</span>
            <span className="text-sm font-bold text-ink">
              {completedCount}{" "}
              <span className="text-cocoa-muted font-normal text-xs">
                / {benefits.length}개
              </span>
            </span>
          </div>
          <div className="h-2.5 w-full bg-linen-dark rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-terra rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Checklist Timeline */}
      <div className="px-1 flex flex-col gap-4">
        {benefits.length === 0 ? (
          <div className="text-center py-10 bg-white/50 rounded-2xl text-cocoa-muted text-sm border border-dashed border-linen-deep">
            현재 주차에 해당하는 혜택이 없습니다.
          </div>
        ) : (
          benefits.map((benefit, index) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 + 0.1 }}
              key={benefit.id}
              onClick={() => handleToggleCheck(benefit.id)}
              className={`relative overflow-hidden group cursor-pointer flex gap-4 p-5 rounded-[24px] border transition-all duration-300 ${
                benefit.completed
                  ? "bg-linen-light/50 border-linen-deep/50 opacity-70"
                  : "bg-white border-linen-deep shadow-sm hover:shadow-md hover:border-terra/30"
              }`}
            >
              {/* Checkbox Icon */}
              <div
                className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center border-2 transition-all duration-300 mt-0.5 ${
                  benefit.completed
                    ? "bg-terra border-terra"
                    : "border-cocoa-muted/30 group-hover:border-terra/50"
                }`}
              >
                {benefit.completed && (
                  <Check className="w-4 h-4 text-white stroke-[3px]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`font-bold leading-tight transition-colors ${
                      benefit.completed ? "text-cocoa line-through" : "text-ink"
                    }`}
                  >
                    {benefit.title}
                  </h3>
                  {benefit.rewardAmount && (
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-terra/10 text-terra text-[11px] font-bold tracking-tight">
                      {benefit.rewardAmount}
                    </span>
                  )}
                </div>

                <p
                  className={`text-[13px] leading-snug transition-colors ${
                    benefit.completed ? "text-cocoa-muted/70" : "text-cocoa"
                  }`}
                >
                  {benefit.description}
                </p>

                {/* Week Badge */}
                <div className="mt-1">
                  <span
                    className={`text-[11px] font-medium tracking-tighter ${
                      benefit.completed
                        ? "text-cocoa-muted/50"
                        : "text-cocoa-muted"
                    }`}
                  >
                    추천 권장: {benefit.recommendedWeekStart}주 ~{" "}
                    {benefit.recommendedWeekEnd}주
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default BenefitsChecklist;
