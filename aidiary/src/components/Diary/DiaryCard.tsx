import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import type { DiaryEntry, EmotionType } from "../../types";
import { EMOTION_COLORS, EMOTION_LABELS } from "../../types";

const EMOTION_EMOJIS: Record<EmotionType, string> = {
  happy: "🌸",
  sad: "🌧️",
  anxious: "🍂",
  tired: "🌙",
  touched: "✨",
  loving: "💕",
  lonely: "🪻",
  calm: "🍃",
  neutral: "☁️",
};

interface DiaryCardProps {
  entry: DiaryEntry;
  isLoadingAI: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRequestAI: () => void;
  onGetDrawing: () => void;
}

const DiaryCard: React.FC<DiaryCardProps> = ({
  entry,
  isLoadingAI,
  onEdit,
  onDelete,
  onRequestAI,
  onGetDrawing,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const emotionColor = EMOTION_COLORS[entry.emotion] || EMOTION_COLORS.calm;
  const emotionLabel = EMOTION_LABELS[entry.emotion] || EMOTION_LABELS.calm;
  const emotionEmoji = EMOTION_EMOJIS[entry.emotion] || "☁️";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-paper hover:shadow-lifted hover:-translate-y-1 transition-all duration-300 border border-white/50"
      data-testid="diary-card"
    >
      {/* Image area */}
      {entry.fetalArtUrl && (
        <div className="relative aspect-[4/3] overflow-hidden bg-linen-dark">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-linen-dark animate-pulse" />
          )}
          <img
            src={entry.fetalArtUrl}
            alt={`${emotionLabel} 감정의 그림일기`}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            data-testid="fetal-art-image"
          />
          <div className="absolute top-3 left-3">
            <span
              className="stamp text-white text-[10px]"
              style={{
                backgroundColor: emotionColor,
                borderColor: emotionColor,
                color: "white",
              }}
              data-testid="emotion-badge"
            >
              {emotionEmoji} {emotionLabel}
            </span>
          </div>
        </div>
      )}

      {/* Card body */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {!entry.fetalArtUrl && (
              <span
                className="stamp"
                style={{ color: emotionColor, borderColor: emotionColor }}
                data-testid="emotion-badge"
              >
                {emotionEmoji} {emotionLabel}
              </span>
            )}
            <time
              className="text-[11px] text-cocoa-muted"
              data-testid="diary-date"
            >
              {dayjs(entry.createdAt).format("M월 D일")}
            </time>
          </div>

          <div className="flex items-center gap-1">
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  className="flex gap-1"
                >
                  <button
                    onClick={onEdit}
                    className="p-1.5 rounded text-cocoa-muted hover:text-terra hover:bg-terra/5 transition-colors"
                    aria-label="수정"
                    data-testid="edit-button"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-1.5 rounded text-cocoa-muted hover:text-red-400 hover:bg-red-50 transition-colors"
                    aria-label="삭제"
                    data-testid="delete-button"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setShowActions((v) => !v)}
              className="p-1.5 rounded text-cocoa-muted hover:text-terra hover:bg-terra/5 transition-colors"
              aria-label="메뉴"
              aria-expanded={showActions}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <p
          className="text-cocoa text-[14px] leading-relaxed whitespace-pre-wrap mb-4"
          data-testid="diary-content"
        >
          {entry.content}
        </p>

        {/* Actions */}
        <div className="pt-4 border-t border-linen-deep/50 space-y-4">
          <div className="flex gap-3">
            {!entry.fetalArtUrl && (
              <button
                onClick={onGetDrawing}
                disabled={isLoadingAI}
                className="flex-1 py-2.5 text-[13px] font-bold tracking-wide rounded-xl border-2 border-terra/30 text-terra hover:bg-terra hover:text-white transition-all duration-300 disabled:opacity-40"
              >
                {isLoadingAI ? "생성 중..." : "그림일기 그리기"}
              </button>
            )}
            <button
              onClick={onRequestAI}
              disabled={isLoadingAI}
              className={`flex-1 py-2.5 text-[13px] font-bold tracking-wide rounded-xl border-2 border-sage/40 text-sage-dark hover:bg-sage hover:text-white transition-all duration-300 disabled:opacity-40 ${!entry.fetalArtUrl ? "" : "w-full"}`}
            >
              {isLoadingAI ? "분석 중..." : "태아 반응 보기"}
            </button>
          </div>

          {/* AI response - like a handwritten note */}
          <AnimatePresence>
            {entry.aiResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, type: "spring" }}
                className="relative p-4 bg-gradient-to-br from-[#FFF9E6]/90 to-[#FFF0C2]/90 backdrop-blur-sm shadow-inner rounded-2xl border border-[#F0E4B8]/60"
                data-testid="ai-response"
              >
                <div
                  className="absolute top-0 right-4 -mt-3 text-2xl animate-bounce"
                  style={{ animationDuration: "2s" }}
                >
                  👶
                </div>
                <p className="text-[14px] text-cocoa leading-relaxed font-medium pr-6 mt-1">
                  {entry.aiResponse}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
};

export default DiaryCard;
