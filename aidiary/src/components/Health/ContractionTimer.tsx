import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle, CheckCircle2, Clock, Activity } from "lucide-react";

interface Contraction {
  id: number;
  start: number;
  end: number;
  duration: number; // seconds
  interval: number | null; // seconds from prev end to this start
}

function fmtDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return `${m}분 ${sec.toString().padStart(2, "0")}초`;
  return `${sec}초`;
}

function fmtInterval(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}분 ${sec.toString().padStart(2, "0")}초`;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const period = h < 12 ? "오전" : "오후";
  return `${period} ${h % 12 || 12}:${m}`;
}

// 5-1-1 rule check
function check511(contractions: Contraction[]): "none" | "watch" | "go" {
  if (contractions.length < 3) return "none";

  // Use the most recent contractions
  const recent = contractions.slice(0, 6);

  // All must have interval info (i.e., not the very first)
  const withInterval = recent.filter((c) => c.interval !== null);
  if (withInterval.length < 2) return "none";

  const avgInterval =
    withInterval.reduce((s, c) => s + (c.interval ?? 0), 0) /
    withInterval.length;
  const avgDuration =
    recent.reduce((s, c) => s + c.duration, 0) / recent.length;

  // 5-1-1: interval ≤5min, duration ≥1min, span ≥1hr
  const intervalOk = avgInterval <= 300; // ≤ 5 min apart
  const durationOk = avgDuration >= 60; // ≥ 1 min each

  if (!intervalOk || !durationOk) return "none";

  // Check if pattern has been going for ≥1 hour
  const oldest = contractions[contractions.length - 1].start;
  const newest = contractions[0].end;
  const spanOk = newest - oldest >= 3600000; // 1 hr

  return spanOk ? "go" : "watch";
}

const STATUS_CONFIG = {
  none: {
    label: "정상 범위",
    sublabel: "계속 기록해 주세요",
    color: "text-cocoa-muted",
    bg: "bg-linen-dark",
    icon: Clock,
  },
  watch: {
    label: "주의 필요",
    sublabel: "수축이 규칙적입니다. 병원에 연락해보세요",
    color: "text-[#C9A000]",
    bg: "bg-[#FFF3D0]",
    icon: AlertTriangle,
  },
  go: {
    label: "병원으로 가세요!",
    sublabel: "5-1-1 규칙 달성 — 지금 바로 병원에 연락하세요",
    color: "text-terra",
    bg: "bg-terra/10",
    icon: AlertTriangle,
  },
} as const;

const itemFade = {
  hidden: { opacity: 0, x: -10 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: { opacity: 0, x: 10, transition: { duration: 0.2 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const ContractionTimer: React.FC = () => {
  const [contractions, setContractions] = useState<Contraction[]>([]);
  const [isContracting, setIsContracting] = useState(false);
  const [elapsed, setElapsed] = useState(0); // current contraction duration (s)
  const [restElapsed, setRestElapsed] = useState(0); // time since last ended (s)

  const startRef = useRef<number>(0);
  const lastEndRef = useRef<number | null>(null);
  const contractionTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRestTimer = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
  };

  const clearContractionTimer = () => {
    if (contractionTimerRef.current) {
      clearInterval(contractionTimerRef.current);
      contractionTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearContractionTimer();
      clearRestTimer();
    };
  }, []);

  const startContraction = useCallback(() => {
    clearRestTimer();
    const now = Date.now();
    startRef.current = now;
    setElapsed(0);
    setIsContracting(true);

    contractionTimerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
  }, []);

  const stopContraction = useCallback(() => {
    clearContractionTimer();

    const now = Date.now();
    const duration = Math.floor((now - startRef.current) / 1000);
    const interval = lastEndRef.current
      ? Math.floor((startRef.current - lastEndRef.current) / 1000)
      : null;

    setContractions((prev) =>
      [
        { id: now, start: startRef.current, end: now, duration, interval },
        ...prev,
      ].slice(0, 12),
    );
    lastEndRef.current = now;
    setIsContracting(false);
    setElapsed(0);
    setRestElapsed(0);

    // Start rest timer
    restTimerRef.current = setInterval(() => {
      setRestElapsed(Math.floor((Date.now() - (lastEndRef.current ?? now)) / 1000));
    }, 500);
  }, []);

  const handleToggle = () => {
    if (isContracting) {
      stopContraction();
    } else {
      startContraction();
    }
  };

  const handleClear = () => {
    clearRestTimer();
    clearContractionTimer();
    setContractions([]);
    setIsContracting(false);
    setElapsed(0);
    setRestElapsed(0);
    lastEndRef.current = null;
  };

  const status = check511(contractions);
  const { label, sublabel, color, bg, icon: StatusIcon } = STATUS_CONFIG[status];
  const showStatus = contractions.length >= 2;

  return (
    <div className="px-5 pt-4 space-y-4 pb-6">
      {/* 헤더 설명 */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-paper">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-terra/10 flex items-center justify-center shrink-0 mt-0.5">
            <Activity className="w-4 h-4 text-terra" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-ink mb-0.5">
              5-1-1 규칙이란?
            </p>
            <p className="text-[12px] text-cocoa-muted leading-relaxed">
              수축이 <span className="font-semibold text-cocoa">5분 간격</span>으로,{" "}
              <span className="font-semibold text-cocoa">1분씩 지속</span>되고,{" "}
              <span className="font-semibold text-cocoa">1시간 이상</span> 계속되면
              병원에 가야 할 때입니다.
            </p>
          </div>
        </div>
      </div>

      {/* 메인 타이머 버튼 */}
      <div className="flex flex-col items-center py-2">
        <motion.button
          onTapStart={handleToggle}
          whileTap={{ scale: 0.96 }}
          className={`relative w-44 h-44 rounded-full flex flex-col items-center justify-center shadow-lifted transition-colors duration-300 ${
            isContracting
              ? "bg-terra text-white"
              : "bg-white/90 text-terra border-2 border-terra/30"
          }`}
        >
          {/* 파동 애니메이션 (수축 중일 때만) */}
          {isContracting && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-terra"
                animate={{ scale: [1, 1.25], opacity: [0.35, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-terra"
                animate={{ scale: [1, 1.5], opacity: [0.2, 0] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.35,
                }}
              />
            </>
          )}

          <motion.div
            key={isContracting ? "contracting" : "idle"}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 flex flex-col items-center gap-1"
          >
            {isContracting ? (
              <>
                <span className="text-4xl font-display font-bold leading-none tabular-nums">
                  {fmtDuration(elapsed)}
                </span>
                <span className="text-[13px] font-semibold opacity-90 mt-1">
                  탭하여 종료
                </span>
              </>
            ) : (
              <>
                {contractions.length === 0 ? (
                  <>
                    <span className="text-[42px] leading-none">🤰</span>
                    <span className="text-[15px] font-bold mt-1">
                      수축 시작
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[13px] font-semibold text-cocoa-muted">
                      쉬는 중
                    </span>
                    <span className="text-3xl font-display font-bold text-ink leading-none tabular-nums mt-0.5">
                      {fmtInterval(restElapsed)}
                    </span>
                    <span className="text-[12px] text-cocoa-muted mt-1">
                      탭하여 다음 수축 기록
                    </span>
                  </>
                )}
              </>
            )}
          </motion.div>
        </motion.button>

        {/* 간격 안내 */}
        {!isContracting && contractions.length > 0 && contractions[0].interval && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-[12px] text-cocoa-muted text-center"
          >
            직전 수축과의 간격:{" "}
            <span className="font-semibold text-cocoa">
              {fmtInterval(contractions[0].interval)}
            </span>
          </motion.p>
        )}
      </div>

      {/* 5-1-1 상태 표시 */}
      <AnimatePresence>
        {showStatus && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl p-4 border border-white/50 shadow-sm flex items-start gap-3 ${bg}`}
          >
            <div className={`mt-0.5 ${color}`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[14px] font-bold ${color}`}>{label}</p>
              <p className="text-[12px] text-cocoa-muted mt-0.5 leading-relaxed">
                {sublabel}
              </p>
            </div>
            {status === "none" && contractions.length >= 3 && (
              <div className="ml-auto flex flex-col items-end gap-0.5 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-sage-dark" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 기록 목록 */}
      {contractions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[13px] font-bold text-ink">
              수축 기록{" "}
              <span className="text-cocoa-muted font-normal">
                ({contractions.length}회)
              </span>
            </p>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-[11px] text-cocoa-muted hover:text-terra transition-colors px-2 py-1 rounded-lg hover:bg-terra/8"
            >
              <Trash2 className="w-3 h-3" />
              전체 삭제
            </button>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            <AnimatePresence initial={false}>
              {contractions.map((c, i) => (
                <motion.div
                  key={c.id}
                  variants={itemFade}
                  layout
                  className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 shadow-sm flex items-center gap-3"
                >
                  {/* 순서 번호 (역순: 최신=1) */}
                  <div className="w-6 h-6 rounded-full bg-terra/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-terra">
                      {contractions.length - i}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] text-cocoa-muted">
                        {fmtTime(c.start)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] bg-terra/10 text-terra px-2 py-0.5 rounded-full font-semibold">
                        지속 {fmtDuration(c.duration)}
                      </span>
                      {c.interval !== null && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                            c.interval <= 300
                              ? "bg-sage/15 text-sage-dark"
                              : "bg-linen-dark text-cocoa-muted"
                          }`}
                        >
                          간격 {fmtInterval(c.interval)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* 통계 요약 */}
          {contractions.length >= 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-3 bg-linen-dark/60 rounded-xl px-4 py-3 flex gap-6"
            >
              <div className="text-center flex-1">
                <p className="text-[10px] text-cocoa-muted mb-0.5">평균 지속</p>
                <p className="text-[13px] font-bold text-ink">
                  {fmtDuration(
                    Math.round(
                      contractions.reduce((s, c) => s + c.duration, 0) /
                        contractions.length,
                    ),
                  )}
                </p>
              </div>
              <div className="w-px bg-linen-deep" />
              <div className="text-center flex-1">
                <p className="text-[10px] text-cocoa-muted mb-0.5">평균 간격</p>
                <p className="text-[13px] font-bold text-ink">
                  {(() => {
                    const withInt = contractions.filter(
                      (c) => c.interval !== null,
                    );
                    if (withInt.length === 0) return "-";
                    return fmtInterval(
                      Math.round(
                        withInt.reduce((s, c) => s + (c.interval ?? 0), 0) /
                          withInt.length,
                      ),
                    );
                  })()}
                </p>
              </div>
              <div className="w-px bg-linen-deep" />
              <div className="text-center flex-1">
                <p className="text-[10px] text-cocoa-muted mb-0.5">총 기록</p>
                <p className="text-[13px] font-bold text-ink">
                  {contractions.length}회
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* 빈 상태 */}
      {contractions.length === 0 && !isContracting && (
        <div className="text-center py-6 text-cocoa-muted text-[13px]">
          <p>위 버튼을 탭해서 수축을 기록하세요</p>
          <p className="text-[12px] mt-1 opacity-70">
            수축이 시작되면 탭 → 끝나면 다시 탭
          </p>
        </div>
      )}
    </div>
  );
};

export default ContractionTimer;
