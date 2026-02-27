import React, { useState, useEffect } from "react";
import { THEME_COLORS } from "../common/FormInput";
import type { DiaryEntry, EmotionType } from "../../types";

interface EditModalProps {
  entry: DiaryEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    id: number,
    data: { title: string; content: string; emotion: EmotionType },
  ) => Promise<boolean>;
}

/**
 * 일기 수정 모달 컴포넌트
 */
const EditModal: React.FC<EditModalProps> = ({
  entry,
  isOpen,
  onClose,
  onSave,
}) => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { sub: subColor } = THEME_COLORS;

  // entry가 변경되면 content 초기화
  useEffect(() => {
    if (entry) {
      setContent(entry.content);
    }
  }, [entry]);

  if (!isOpen || !entry) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const success = await onSave(entry.id, {
        title: entry.title,
        content,
        emotion: entry.emotion,
      });
      if (success) {
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className="bg-white/95 backdrop-blur-md rounded-3xl w-full max-w-lg shadow-lifted border border-white/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: `${subColor}20` }}
        >
          <h2 className="text-xl font-bold" style={{ color: subColor }}>
            일기 수정
          </h2>
        </div>

        {/* 내용 */}
        <div className="p-8">
          <textarea
            className="w-full h-48 p-5 rounded-2xl resize-none focus:outline-none focus:ring-4 transition-all duration-300 text-cocoa leading-relaxed"
            style={{
              backgroundColor: "rgba(250, 250, 250, 0.7)",
              borderColor: `${subColor}30`,
              borderWidth: "1px",
              boxShadow: `0 0 0 0 ${subColor}25`,
            }}
            onFocus={(e) =>
              (e.target.style.boxShadow = `0 0 0 4px ${subColor}20`)
            }
            onBlur={(e) => (e.target.style.boxShadow = `0 0 0 0 ${subColor}20`)}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* 푸터 버튼 */}
        <div
          className="px-8 py-5 border-t flex justify-end gap-3"
          style={{ borderColor: `${subColor}15` }}
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 rounded-full text-cocoa-muted font-medium hover:bg-black/5 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-8 py-3 rounded-full text-white font-bold tracking-wide transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5"
            style={{ backgroundColor: subColor }}
          >
            {isLoading ? (
              <div className="flex gap-1.5 items-center justify-center">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-white opacity-60 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            ) : (
              "수정 완료"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
