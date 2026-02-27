import React, { useState } from "react";
import type { ChatMessage } from "../../types";

interface CharacterChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
}

/**
 * AI 채팅 컴포넌트
 */
const CharacterChat: React.FC<CharacterChatProps> = ({
  messages,
  onSendMessage,
}) => {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);
    const message = input;
    setInput("");

    try {
      await onSendMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mt-4">
      {/* 메시지 목록 */}
      <div
        className="max-h-[350px] overflow-y-auto mb-4 p-5 rounded-3xl min-h-[200px] flex flex-col gap-4 backdrop-blur-md border border-white/20"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.6)",
          boxShadow: "0 8px 32px rgba(60, 46, 36, 0.05)",
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 my-auto">
            <p>👶 아이에게 말을 걸어보세요!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`w-fit max-w-[85%] px-5 py-3.5 transition-all duration-300 hover:scale-[1.01] text-[15px] leading-relaxed shadow-sm ${
                msg.sender === "user"
                  ? "self-end rounded-[24px_24px_4px_24px] bg-[#C67D5B] text-white"
                  : "self-start rounded-[24px_24px_24px_4px] bg-[#F7F3ED] text-[#5C4033] border border-[#E2D9CC]/50"
              }`}
              style={{
                boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
              }}
            >
              {msg.content}
            </div>
          ))
        )}
      </div>

      {/* 입력 필드 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSending}
          placeholder="아이에게 다정한 말을 건네보세요..."
          className="flex-1 px-5 py-4 rounded-full bg-white/70 backdrop-blur-sm border border-terra/30 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-terra/20 focus:border-terra hover:shadow-md disabled:opacity-50 text-[14px] text-cocoa"
        />
        <button
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          className="px-6 py-4 rounded-full text-white font-bold tracking-wide transition-all duration-300 hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 flex items-center justify-center min-w-[80px] bg-terra hover:bg-terra-dark"
        >
          {isSending ? (
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
            "전송"
          )}
        </button>
      </div>
    </div>
  );
};

export default CharacterChat;
