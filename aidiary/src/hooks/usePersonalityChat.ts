import { useState, useCallback } from "react";
import { personalityApi } from "../api/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UsePersonalityChatReturn {
  messages: Message[];
  isLoading: boolean;
  isComplete: boolean;
  turnCount: number;
  startInterview: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
}

export const usePersonalityChat = (parentLabel: string): UsePersonalityChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  const startInterview = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await personalityApi.chat({
        message: "안녕하세요, 인터뷰를 시작해주세요.",
        history: [],
        parent_label: parentLabel,
        turn_count: 0,
      });
      const aiResponse: string = res.data.response;
      const complete: boolean = res.data.is_complete;
      setMessages([{ role: "assistant", content: aiResponse }]);
      setTurnCount(1);
      if (complete) setIsComplete(true);
    } finally {
      setIsLoading(false);
    }
  }, [parentLabel]);

  const sendMessage = useCallback(async (content: string) => {
    if (isLoading || isComplete) return;

    const userMsg: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const historyForApi = [...messages, userMsg].map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

      const newTurnCount = turnCount + 1;
      const res = await personalityApi.chat({
        message: content,
        history: historyForApi.slice(0, -1), // exclude the current user message (sent separately)
        parent_label: parentLabel,
        turn_count: newTurnCount,
      });

      const aiResponse: string = res.data.response;
      const complete: boolean = res.data.is_complete;

      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
      setTurnCount(newTurnCount);
      if (complete) setIsComplete(true);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, isComplete, turnCount, parentLabel]);

  return { messages, isLoading, isComplete, turnCount, startInterview, sendMessage };
};
