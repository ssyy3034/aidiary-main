import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import {
  Feather,
  Droplets,
  Zap,
  Trash2,
  Plus,
  ChevronDown,
} from "lucide-react";
import { fetalApi } from "../../api/client";
import type { FetalMovement, FetalMovementSummary } from "../../types";

const INTENSITY_CONFIG = {
  1: {
    label: "약",
    icon: Feather,
    color: "text-sage-dark bg-sage/15 border-sage/30",
  },
  2: {
    label: "보통",
    icon: Droplets,
    color: "text-[#C9A000] bg-[#FFF3D0] border-[#F0E4B8]",
  },
  3: {
    label: "강",
    icon: Zap,
    color: "text-terra bg-terra/10 border-terra/25",
  },
} as const;

const DAILY_GOAL = 10;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const itemFade = {
  hidden: { opacity: 0, x: -12 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// 박동하는 하트 카운터
const PulsingCounter: React.FC<{ count: number; goal: number }> = ({
  count,
  goal,
}) => {
  const controls = useAnimationControls();
  const pct = Math.min((count / goal) * 100, 100);
  const reached = count >= goal;

  useEffect(() => {
    if (count > 0) {
      controls.start({
        scale: [1, 1.3, 1],
        transition: { duration: 0.4, ease: "easeOut" },
      });
    }
  }, [count, controls]);

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* 하트 + 숫자 */}
      <div className="relative flex items-center justify-center">
        {/* 파동 링 */}
        {count > 0 && (
          <>
            <motion.div
              className="absolute rounded-full border-2 border-terra/30"
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              style={{ width: 80, height: 80 }}
            />
            <motion.div
              className="absolute rounded-full border border-terra/20"
              animate={{ scale: [1, 2.1], opacity: [0.3, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.4,
              }}
              style={{ width: 80, height: 80 }}
            />
          </>
        )}
        <div className="w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm border border-white/60 shadow-lifted flex items-center justify-center flex-col gap-1">
          <motion.span animate={controls} className="text-2xl leading-none">
            💗
          </motion.span>
          <motion.span
            key={count}
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="text-xl font-display font-bold text-ink leading-none"
          >
            {count}
          </motion.span>
        </div>
      </div>

      {/* 레이블 */}
      <div className="text-center">
        <p className="text-[13px] text-cocoa-muted">
          오늘 태동 횟수{" "}
          <span className="text-cocoa font-semibold">/ 목표 {goal}회</span>
        </p>
      </div>

      {/* 목표 게이지 */}
      <div className="w-full max-w-[240px]">
        <div className="h-2 bg-linen-dark rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-colors duration-500 ${
              reached ? "bg-sage" : "bg-terra"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        {reached && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-[12px] text-sage-dark font-semibold mt-1.5"
          >
            🎉 오늘 목표 달성!
          </motion.p>
        )}
      </div>
    </div>
  );
};

// 강도 선택 버튼
const IntensitySelector: React.FC<{
  value: 1 | 2 | 3;
  onChange: (v: 1 | 2 | 3) => void;
}> = ({ value, onChange }) => (
  <div className="flex gap-2">
    {([1, 2, 3] as const).map((v) => {
      const { label, icon: Icon, color } = INTENSITY_CONFIG[v];
      const isActive = value === v;
      return (
        <motion.button
          key={v}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(v)}
          className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${
            isActive
              ? color + " shadow-sm"
              : "bg-white/40 text-cocoa-muted border-linen-deep"
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </motion.button>
      );
    })}
  </div>
);

// 타임라인 아이템
const MovementItem: React.FC<{
  item: FetalMovement;
  onDelete: (id: number) => void;
  isLast: boolean;
}> = ({ item, onDelete, isLast }) => {
  const { label, icon: Icon, color } = INTENSITY_CONFIG[item.intensity];

  return (
    <motion.div variants={itemFade} className="flex gap-3">
      {/* 타임라인 선 */}
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-terra mt-1.5 shrink-0" />
        {!isLast && <div className="w-0.5 flex-1 bg-linen-deep mt-1" />}
      </div>

      {/* 내용 */}
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-cocoa-muted">
              {formatTime(item.movementTime)}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-semibold ${color}`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-cocoa-muted hover:text-terra transition-colors rounded-lg hover:bg-terra/8"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
        {item.notes && (
          <p className="text-[13px] text-cocoa mt-1.5 leading-relaxed">
            {item.notes}
          </p>
        )}
      </div>
    </motion.div>
  );
};

const FetalMovementTracker: React.FC = () => {
  const [summary, setSummary] = useState<FetalMovementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [intensity, setIntensity] = useState<1 | 2 | 3>(2);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [quickLogging, setQuickLogging] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetalApi.getToday();
      setSummary(res.data);
    } catch {
      setSummary({ todayCount: 0, todayMaxIntensity: 0, todayMovements: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleQuickLog = async () => {
    setQuickLogging(true);
    try {
      await fetalApi.log({
        movementTime: new Date().toISOString().slice(0, 19),
        intensity: 2,
      });
      await loadSummary();
    } catch {
    } finally {
      setQuickLogging(false);
    }
  };

  const handleDetailLog = async () => {
    setSubmitting(true);
    try {
      await fetalApi.log({
        movementTime: new Date().toISOString().slice(0, 19),
        intensity,
        notes: notes.trim() || undefined,
      });
      setNotes("");
      setShowForm(false);
      await loadSummary();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetalApi.delete(id);
      await loadSummary();
    } catch {}
  };

  if (loading) {
    return (
      <div className="px-5 pt-4 space-y-4">
        <div className="flex justify-center py-10">
          <div className="w-20 h-20 rounded-full bg-linen-dark animate-pulse" />
        </div>
        <div className="h-10 bg-linen-dark rounded-2xl animate-pulse" />
        <div className="h-10 bg-linen-dark rounded-2xl animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 bg-white/60 rounded-xl border border-linen-deep animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const movements = summary?.todayMovements ?? [];

  return (
    <div className="px-5 pt-4 space-y-4">
      {/* 하트 카운터 */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-paper border border-white/50">
        <PulsingCounter count={summary?.todayCount ?? 0} goal={DAILY_GOAL} />
      </div>

      {/* 빠른 기록 버튼 */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleQuickLog}
          disabled={quickLogging}
          className="flex items-center justify-center gap-2 bg-terra text-white rounded-2xl py-4 font-bold text-[14px] shadow-sm disabled:opacity-60"
        >
          {quickLogging ? (
            <span className="animate-spin text-lg">💗</span>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              빠른 기록
            </>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm((v) => !v)}
          className={`flex items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-[14px] border transition-colors ${
            showForm
              ? "bg-linen-dark text-cocoa border-linen-deep"
              : "bg-white/80 text-terra border-terra/30 hover:bg-terra/5"
          }`}
        >
          <span>상세 기록</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${showForm ? "rotate-180" : ""}`}
          />
        </motion.button>
      </div>

      {/* 상세 기록 폼 */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-paper border border-white/50 space-y-3">
              <p className="text-[12px] font-bold tracking-widest text-cocoa-muted uppercase">
                강도 선택
              </p>
              <IntensitySelector value={intensity} onChange={setIntensity} />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="메모를 남겨보세요 (선택)"
                rows={2}
                className="w-full rounded-xl border border-linen-deep bg-linen/60 px-3.5 py-2.5 text-[14px] text-cocoa placeholder:text-cocoa-muted/70 resize-none focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra/50 transition"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-linen-deep text-sm text-cocoa-muted font-semibold hover:bg-linen-dark transition-colors"
                >
                  취소
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDetailLog}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-terra text-white text-sm font-bold shadow-sm disabled:opacity-60"
                >
                  {submitting ? "저장 중..." : "기록 저장"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 오늘 타임라인 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold text-ink">오늘의 태동 기록</h2>
          <span className="text-[11px] text-cocoa-muted">
            {new Date().toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {movements.length === 0 ? (
          <div className="bg-white/60 rounded-2xl p-8 border border-linen-deep text-center">
            <p className="text-3xl mb-2">🤱</p>
            <p className="text-[14px] font-display font-bold text-ink mb-1">
              아직 기록이 없어요
            </p>
            <p className="text-[13px] text-cocoa-muted leading-relaxed">
              태동을 느끼면 위의 버튼을
              <br />
              눌러 기록해보세요
            </p>
          </div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-paper border border-white/50"
          >
            {[...movements].reverse().map((m, i, arr) => (
              <MovementItem
                key={m.id}
                item={m}
                onDelete={handleDelete}
                isLast={i === arr.length - 1}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const period = h < 12 ? "오전" : "오후";
  const hour = h % 12 || 12;
  return `${period} ${hour}:${m}`;
}

export default FetalMovementTracker;
