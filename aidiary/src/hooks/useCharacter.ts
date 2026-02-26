import { useState, useEffect, useCallback } from "react";
import { chatApi, imageApi } from "../api/client";
import { useAuthStore } from "../stores";
import type { CharacterData, ChatMessage } from "../types";
import { createImageCompressionWorker } from "../utils/workerFactory";

interface UseCharacterReturn {
  // 상태
  characterData: CharacterData | null;
  generatedImage: string | null;
  isLoading: boolean;
  status: string;
  messages: ChatMessage[];

  // 입력 상태
  childName: string;
  childBirthday: string;
  setChildName: (name: string) => void;
  setChildBirthday: (date: string) => void;

  // 액션
  generateCharacter: (
    parent1File: File,
    parent2File: File,
    personality: string,
  ) => Promise<CharacterData | null>;
  sendMessage: (content: string) => Promise<void>;
  setStatus: (status: string) => void;
}

/**
 * 캐릭터 관련 비즈니스 로직을 캡슐화하는 커스텀 훅
 * Refactored: 상태 관리를 useAuthStore로 위임하여 Single Source of Truth 원칙 준수
 */
export const useCharacter = (
  onCharacterCreated: (data: CharacterData) => Promise<void>,
): UseCharacterReturn => {
  // Global Store State
  const { characterData, setCharacter, clearCharacter } = useAuthStore();

  // Local UI State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Form State
  const [childName, setChildName] = useState("");
  const [childBirthday, setChildBirthday] = useState("");

  // Blob to Base64 변환
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Store 데이터 동기화 및 오염된 데이터(HTML) 자동 정리
  useEffect(() => {
    if (characterData) {
      // 만약 데이터가 HTML 형태라면(실패한 요청의 결과) 초기화 처리
      const isCorrupted =
        characterData.characterImage?.toUpperCase().includes("<!DOCTYPE") ||
        characterData.characterImage?.toUpperCase().includes("<HTML") ||
        characterData.characterImage?.includes("data:text/html") ||
        (characterData.characterImage?.startsWith("data:image") &&
          atob(characterData.characterImage.split(",")[1])
            .toUpperCase()
            .includes("<!DOCTYPE"));

      if (isCorrupted) {
        console.warn("오염된 캐릭터 데이터를 감지하여 초기화합니다.");
        clearCharacter();
        setGeneratedImage(null);
        return;
      }

      setGeneratedImage(characterData.characterImage);
      setChildName(characterData.childName);
      setChildBirthday(characterData.childBirthday);
    }
  }, [characterData, clearCharacter]);

  // 캐릭터 생성
  const generateCharacter = useCallback(
    async (
      parent1File: File,
      parent2File: File,
      personality: string,
    ): Promise<CharacterData | null> => {
      if (!childName || !childBirthday) {
        setStatus("아이 정보를 입력해주세요.");
        return null;
      }

      // ===== 🚀 Performance Optimization (Web Worker) =====
      // 이미지를 백그라운드 스레드에서 압축하여 UI Freezing을 방지합니다.
      const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          // Web Worker 인스턴스 생성 (Factory 사용)
          const worker = createImageCompressionWorker();

          worker.onmessage = (e) => {
            if (e.data.success) {
              resolve(e.data.blob);
            } else {
              reject(new Error(e.data.error || "Image compression failed"));
            }
            worker.terminate(); // 작업 완료 후 워커 정리
          };

          worker.onerror = (err) => {
            reject(new Error(err.message || "Worker error occurred"));
            worker.terminate();
          };

          // 워커에 작업 지시 (1024px로 리사이징, 퀄리티 0.8)
          worker.postMessage({ file, quality: 0.8, maxWidth: 1024 });
        });
      };

      try {
        setStatus("이미지 최적화 중... (백그라운드 처리)");

        // 병렬로 두 이미지 압축 시작
        const [compressedParent1, compressedParent2] = await Promise.all([
          compressImage(parent1File),
          compressImage(parent2File),
        ]);

        setStatus("분석 중... (최적화된 이미지 전송)");
        setIsLoading(true);
        setGeneratedImage(null);

        const formData = new FormData();
        // 원본 대신 압축된 Blob 전송
        formData.append("parent1", compressedParent1, parent1File.name);
        formData.append("parent2", compressedParent2, parent2File.name);

        const response = await imageApi.analyze(formData);

        // ===== 🛡️ Integrity Validation =====
        // CloudFront 에러 페이지(HTML)가 이미지로 오해받아 저장되는 것을 방지합니다.
        const blob = response.data;
        if (blob.type.includes("text/html")) {
          throw new Error(
            "이미지 생성 서버 응답에 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
          );
        }

        const imageUrl = URL.createObjectURL(blob);
        const base64Image = await blobToBase64(blob);
        setGeneratedImage(imageUrl);
        setStatus("캐릭터 생성 성공!");

        // ... (이후 로직은 동일)

        const newCharacter: CharacterData = {
          childName,
          childBirthday,
          parent1Features: "",
          parent2Features: "",
          prompt: "",
          gptResponse: personality || "",
          characterImage: base64Image,
        };

        // DB 저장 (Parent Component 위임)
        await onCharacterCreated(newCharacter);

        // Store 업데이트 (낙관적 업데이트)
        setCharacter(newCharacter);

        return newCharacter;
      } catch (error) {
        console.error("Error:", error);
        setStatus("서버 연결 실패");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [childName, childBirthday, onCharacterCreated, setCharacter],
  );

  // 메시지 전송
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: ChatMessage = { sender: "user", content };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const lastAiMessage = messages.filter((m) => m.sender === "ai").pop();
        const response = await chatApi.send(
          content,
          lastAiMessage?.content || "",
        );

        if (response.data.success) {
          const aiMessage: ChatMessage = {
            sender: "ai",
            content: response.data.response,
          };
          setMessages((prev) => [...prev, aiMessage]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              content: response.data.error || "AI 응답에 실패했어요.",
            },
          ]);
        }
      } catch (error) {
        console.error("채팅 API 호출 실패:", error);
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            content: "AI 응답에 실패했어요. 잠시 후 다시 시도해 주세요.",
          },
        ]);
      }
    },
    [messages],
  );

  return {
    characterData, // Store State
    generatedImage,
    isLoading,
    status,
    messages,
    childName,
    childBirthday,
    setChildName,
    setChildBirthday,
    generateCharacter,
    sendMessage,
    setStatus,
  };
};

export default useCharacter;
