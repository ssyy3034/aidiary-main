import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface DiaryFormProps {
  dailyPrompt: string;
  isLoading: boolean;
  onSubmit: (content: string) => Promise<boolean>;
}

const MAX_LENGTH = 500;

const DiaryForm: React.FC<DiaryFormProps> = ({ dailyPrompt, isLoading, onSubmit }) => {
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.max(128, el.scrollHeight)}px`;
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;
    const success = await onSubmit(content);
    if (success) {
      setContent("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const addPromptToContent = () => {
    setContent((prev) => `${dailyPrompt}\n${prev}`);
    textareaRef.current?.focus();
  };

  const charCount = content.length;
  const charRatio = charCount / MAX_LENGTH;

  return (
    <div className="space-y-4" data-testid="diary-form">
      {/* Daily prompt - like a sticky note */}
      {dailyPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-4 bg-[#FFF9E6] border border-[#F0E4B8] rounded-sm shadow-paper cursor-pointer group transform rotate-[0.5deg] hover:rotate-0 transition-transform"
          onClick={addPromptToContent}
          data-testid="daily-prompt"
        >
          <p className="text-[11px] font-bold tracking-widest text-terra uppercase mb-1.5">
            오늘의 질문
          </p>
          <p className="text-ink text-[14px] leading-relaxed">{dailyPrompt}</p>
          <p className="text-[11px] text-cocoa-muted mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            탭하여 일기에 추가 &rarr;
          </p>
        </motion.div>
      )}

      {/* Writing area - notebook style */}
      <form onSubmit={handleSubmit} data-testid="diary-submit-form">
        <div
          className={`bg-white rounded-lg border shadow-paper transition-all duration-150 ${
            isFocused ? "border-terra/40 shadow-paper-hover" : "border-linen-deep"
          }`}
        >
          {/* Red margin line + notebook lines */}
          <div className="relative p-5 pl-12">
            {/* Red margin line */}
            <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-red-200/40" />

            <textarea
              ref={textareaRef}
              className="w-full min-h-[128px] p-0 resize-none focus:outline-none bg-transparent text-ink text-[15px] leading-[32px] placeholder:text-cocoa-muted/35 font-body notebook-lines"
              placeholder="오늘 하루, 아기에게 들려주고 싶은 이야기..."
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isLoading}
              data-testid="diary-textarea"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-linen-deep">
            <span
              className={`text-[11px] tabular-nums font-body ${
                charRatio > 0.9 ? "text-red-400" : charRatio > 0.7 ? "text-terra" : "text-cocoa-muted/50"
              }`}
              data-testid="char-counter"
            >
              {charCount}/{MAX_LENGTH}
            </span>

            <button
              type="submit"
              disabled={isLoading || !content.trim()}
              className="px-5 py-2 text-[13px] font-bold text-white rounded-md bg-terra hover:bg-terra-dark transition-colors disabled:opacity-35 disabled:cursor-not-allowed tracking-wide"
              data-testid="submit-button"
            >
              {isLoading ? "기록 중..." : "기록하기"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DiaryForm;
