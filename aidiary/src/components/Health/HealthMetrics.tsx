import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Check } from "lucide-react";
import { healthApi } from "../../api/client";
import type { HealthMetric } from "../../types";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// 혈압 분류
function getBPCategory(systolic: number, diastolic: number) {
  if (systolic < 120 && diastolic < 80)
    return { label: "정상", color: "text-sage-dark bg-sage/15 border-sage/30" };
  if (systolic < 130 && diastolic < 80)
    return {
      label: "주의",
      color: "text-[#C9A000] bg-[#FFF3D0] border-[#F0E4B8]",
    };
  return {
    label: "고혈압 주의",
    color: "text-terra bg-terra/10 border-terra/25",
  };
}

// 트렌드 아이콘
const TrendBadge: React.FC<{
  delta: number;
  unit: string;
  invert?: boolean;
}> = ({ delta, unit, invert = false }) => {
  if (Math.abs(delta) < 0.01)
    return <Minus className="w-3.5 h-3.5 text-cocoa-muted" />;
  const isUp = delta > 0;
  const isGood = invert ? !isUp : isUp; // 혈압은 내려가는게 좋음
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
        isGood ? "text-sage-dark" : "text-terra"
      }`}
    >
      {isUp ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {Math.abs(delta).toFixed(1)}
      {unit}
    </span>
  );
};

// SVG 라인차트 (체중 or 혈압)
const LineChart: React.FC<{
  datasets: { values: number[]; color: string; dashed?: boolean }[];
  labels: string[];
  height?: number;
}> = ({ datasets, labels, height = 100 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 300;
  const H = height;
  const padX = 28;
  const padY = 12;
  const allVals = datasets.flatMap((d) => d.values);
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;
  const n = datasets[0].values.length;

  const toX = (i: number) => padX + (i / (n - 1)) * (W - 2 * padX);
  const toY = (v: number) => H - padY - ((v - min) / range) * (H - 2 * padY);

  const toPath = (vals: number[]) =>
    vals
      .map(
        (v, i) =>
          `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`,
      )
      .join(" ");

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full overflow-visible"
    >
      {/* 수평 그리드 */}
      {[0.25, 0.5, 0.75].map((p) => (
        <line
          key={p}
          x1={padX}
          y1={toY(min + range * p)}
          x2={W - padX}
          y2={toY(min + range * p)}
          stroke="#E2D9CC"
          strokeWidth="1"
        />
      ))}
      {/* 라인 */}
      {datasets.map((d, di) => {
        return (
          <motion.path
            key={di}
            d={toPath(d.values)}
            fill="none"
            stroke={d.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={d.dashed ? "5 3" : undefined}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 1.2,
              ease: "easeOut",
              delay: 0.2 + di * 0.15,
            }}
          />
        );
      })}
      {/* 점 */}
      {datasets.map((d, di) =>
        d.values.map((v, i) => (
          <motion.circle
            key={`${di}-${i}`}
            cx={toX(i)}
            cy={toY(v)}
            r="3.5"
            fill="white"
            stroke={d.color}
            strokeWidth="2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.05 }}
          />
        )),
      )}
      {/* x축 레이블 */}
      {labels.map((l, i) => (
        <text
          key={i}
          x={toX(i)}
          y={H + 4}
          textAnchor="middle"
          fontSize="9"
          fill="#A69580"
        >
          {l}
        </text>
      ))}
      {/* y축 min/max */}
      <text
        x={padX - 4}
        y={toY(max) + 4}
        textAnchor="end"
        fontSize="9"
        fill="#A69580"
      >
        {max.toFixed(0)}
      </text>
      <text
        x={padX - 4}
        y={toY(min) + 4}
        textAnchor="end"
        fontSize="9"
        fill="#A69580"
      >
        {min.toFixed(0)}
      </text>
    </svg>
  );
};

// 입력 필드
const MetricInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  unit?: string;
  type?: string;
  step?: string;
}> = ({ label, value, onChange, placeholder, unit, type = "number", step }) => (
  <div className="relative">
    <label className="block text-[11px] font-semibold text-cocoa-muted mb-1">
      {label}
    </label>
    <div className="relative">
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-linen-deep bg-white/60 px-3.5 py-2.5 text-[14px] text-cocoa placeholder:text-cocoa-muted/60 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra/50 transition pr-10"
      />
      {unit && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-cocoa-muted font-medium">
          {unit}
        </span>
      )}
    </div>
  </div>
);

const HealthMetrics: React.FC = () => {
  const [history, setHistory] = useState<HealthMetric[]>([]);
  const [latest, setLatest] = useState<HealthMetric | null>(null);
  const [loading, setLoading] = useState(true);

  const [weight, setWeight] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [histRes, latRes] = await Promise.allSettled([
        healthApi.getHistory(),
        healthApi.getLatest(),
      ]);
      if (histRes.status === "fulfilled") setHistory(histRes.value.data ?? []);
      if (latRes.status === "fulfilled" && latRes.value.status !== 204)
        setLatest(latRes.value.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const w = weight ? parseFloat(weight) : undefined;
    const s = systolic ? parseInt(systolic) : undefined;
    const d = diastolic ? parseInt(diastolic) : undefined;
    if (w === undefined && s === undefined && d === undefined) return;
    setSubmitting(true);
    try {
      await healthApi.save({ weight: w, systolic: s, diastolic: d });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setWeight("");
      setSystolic("");
      setDiastolic("");
      await loadData();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-5 pt-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-linen-dark rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  const prev = history.length >= 2 ? history[1] : null;
  const weightDelta =
    latest?.weight && prev?.weight ? latest.weight - prev.weight : null;
  const sysDelta =
    latest?.systolic && prev?.systolic ? latest.systolic - prev.systolic : null;

  const weightHistory = history
    .filter((h) => h.weight != null)
    .slice()
    .reverse();
  const bpHistory = history
    .filter((h) => h.systolic != null)
    .slice()
    .reverse();

  const formatLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="px-5 pt-4 space-y-4"
    >
      {/* 최신 측정값 카드 */}
      {latest && (
        <motion.div
          variants={fadeUp}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-paper border border-white/50"
        >
          <p className="text-[11px] font-bold tracking-widest text-cocoa-muted uppercase mb-3">
            최근 측정값
          </p>
          <div className="flex gap-4">
            {latest.weight != null && (
              <div className="flex-1 bg-linen/60 rounded-xl p-3 text-center">
                <p className="text-[11px] text-cocoa-muted mb-1">체중</p>
                <p className="text-2xl font-display font-bold text-ink">
                  {latest.weight}
                  <span className="text-[13px] font-normal text-cocoa-muted ml-0.5">
                    kg
                  </span>
                </p>
                {weightDelta !== null && (
                  <div className="mt-1 flex justify-center">
                    <TrendBadge delta={weightDelta} unit="kg" />
                  </div>
                )}
              </div>
            )}
            {latest.systolic != null && latest.diastolic != null && (
              <div className="flex-1 bg-linen/60 rounded-xl p-3 text-center">
                <p className="text-[11px] text-cocoa-muted mb-1">혈압</p>
                <p className="text-2xl font-display font-bold text-ink">
                  {latest.systolic}
                  <span className="text-[13px] font-normal text-cocoa-muted">
                    /
                  </span>
                  {latest.diastolic}
                </p>
                <div className="mt-1 flex flex-col items-center gap-1">
                  {sysDelta !== null && (
                    <TrendBadge delta={sysDelta} unit="" invert />
                  )}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                      getBPCategory(latest.systolic, latest.diastolic).color
                    }`}
                  >
                    {getBPCategory(latest.systolic, latest.diastolic).label}
                  </span>
                </div>
              </div>
            )}
          </div>
          <p className="text-[11px] text-cocoa-muted text-center mt-2">
            {formatDateKr(latest.recordDate)} 기록
          </p>
        </motion.div>
      )}

      {/* 입력 폼 */}
      <motion.div
        variants={fadeUp}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-paper border border-white/50"
      >
        <p className="text-[11px] font-bold tracking-widest text-cocoa-muted uppercase mb-3">
          오늘 기록
        </p>
        <div className="space-y-3">
          <MetricInput
            label="체중"
            value={weight}
            onChange={setWeight}
            placeholder="58.5"
            unit="kg"
            step="0.1"
          />
          <div>
            <label className="block text-[11px] font-semibold text-cocoa-muted mb-1">
              혈압
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  placeholder="수축기 (120)"
                  className="w-full rounded-xl border border-linen-deep bg-white/60 px-3.5 py-2.5 text-[14px] text-cocoa placeholder:text-cocoa-muted/60 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra/50 transition"
                />
              </div>
              <span className="text-cocoa-muted font-bold text-lg">/</span>
              <div className="flex-1">
                <input
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  placeholder="이완기 (80)"
                  className="w-full rounded-xl border border-linen-deep bg-white/60 px-3.5 py-2.5 text-[14px] text-cocoa placeholder:text-cocoa-muted/60 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra/50 transition"
                />
              </div>
              <span className="text-[11px] text-cocoa-muted shrink-0">
                mmHg
              </span>
            </div>
            {/* 입력 중 실시간 혈압 분류 */}
            <AnimatePresence>
              {systolic && diastolic && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mt-1.5 text-[11px] font-semibold ${
                    getBPCategory(parseInt(systolic), parseInt(diastolic)).color
                  } px-2 py-0.5 rounded-full border w-fit`}
                >
                  {getBPCategory(parseInt(systolic), parseInt(diastolic)).label}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={submitting || (!weight && !systolic && !diastolic)}
          className={`w-full mt-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
            saved
              ? "bg-sage text-white"
              : "bg-terra text-white disabled:opacity-40"
          } shadow-sm`}
        >
          <span className="flex items-center justify-center gap-2">
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                저장 완료!
              </>
            ) : submitting ? (
              "저장 중..."
            ) : (
              "기록 저장"
            )}
          </span>
        </motion.button>
      </motion.div>

      {/* 체중 차트 */}
      <AnimatePresence>
        {weightHistory.length >= 2 && (
          <motion.div
            variants={fadeUp}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-paper border border-white/50"
          >
            <p className="text-[11px] font-bold tracking-widest text-cocoa-muted uppercase mb-4">
              체중 변화
            </p>
            <div className="pb-5">
              <LineChart
                datasets={[
                  {
                    values: weightHistory.map((d) => d.weight!),
                    color: "#C67D5B",
                  },
                ]}
                labels={weightHistory.map((d) => formatLabel(d.recordDate))}
                height={90}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 혈압 차트 */}
      <AnimatePresence>
        {bpHistory.length >= 2 && (
          <motion.div
            variants={fadeUp}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-paper border border-white/50"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-cocoa-muted uppercase">
                혈압 변화
              </p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-cocoa-muted">
                  <span className="w-3 h-0.5 bg-terra inline-block rounded-full" />
                  수축기
                </span>
                <span className="flex items-center gap-1 text-[10px] text-cocoa-muted">
                  <span
                    className="w-3 h-0.5 bg-dusty inline-block rounded-full"
                    style={{ borderTop: "2px dashed #B0A4A0", height: 0 }}
                  />
                  이완기
                </span>
              </div>
            </div>
            <div className="pb-5">
              <LineChart
                datasets={[
                  {
                    values: bpHistory.map((d) => d.systolic!),
                    color: "#C67D5B",
                  },
                  {
                    values: bpHistory.map((d) => d.diastolic!),
                    color: "#B0A4A0",
                    dashed: true,
                  },
                ]}
                labels={bpHistory.map((d) => formatLabel(d.recordDate))}
                height={90}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 히스토리 리스트 */}
      {history.length > 0 ? (
        <motion.div variants={fadeUp}>
          <h2 className="text-[13px] font-bold text-ink mb-2">기록 히스토리</h2>
          <div className="space-y-2">
            {history.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between bg-white/60 rounded-xl px-4 py-3 border border-linen-deep"
              >
                <span className="text-[12px] text-cocoa-muted font-medium">
                  {formatDateKr(m.recordDate)}
                </span>
                <div className="flex gap-3">
                  {m.weight != null && (
                    <span className="text-[13px] text-cocoa">
                      <span className="font-bold text-ink">{m.weight}</span>
                      <span className="text-cocoa-muted text-[11px]"> kg</span>
                    </span>
                  )}
                  {m.systolic != null && m.diastolic != null && (
                    <span className="text-[13px] text-cocoa">
                      <span className="font-bold text-ink">
                        {m.systolic}/{m.diastolic}
                      </span>
                      <span className="text-cocoa-muted text-[11px]">
                        {" "}
                        mmHg
                      </span>
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          variants={fadeUp}
          className="bg-white/60 rounded-2xl p-8 border border-linen-deep text-center"
        >
          <p className="text-3xl mb-2">📋</p>
          <p className="text-[14px] font-display font-bold text-ink mb-1">
            아직 기록이 없어요
          </p>
          <p className="text-[13px] text-cocoa-muted">
            위 입력 폼으로 오늘 건강 지표를 기록해보세요
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

function formatDateKr(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default HealthMetrics;
