/**
 * 공통 타입 정의
 */

// 캐릭터 데이터
export interface CharacterData {
  id?: number;
  childName: string;
  childBirthday: string;
  parent1Features: string;
  parent2Features: string;
  prompt: string;
  gptResponse: string;
  characterImage: string;
}

// 사용자 프로필
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  password?: string;
  phone: string;
  child?: ChildInfo | null;
}

// 아이 정보
export interface ChildInfo {
  id?: number;
  childName: string;
  meetDate?: string;
  characterImage?: string;
}

// 인증 상태
export interface AuthState {
  isAuthenticated: boolean;
  hasCharacter: boolean;
  characterData: CharacterData | null;
  userInfo: UserProfile | null;
}

// 일기 엔트리
export interface DiaryEntry {
  id: number;
  title: string;
  content: string;
  emotion: EmotionType;
  createdAt: string;
  aiResponse?: string;
  fetalArtUrl?: string;
}

// 감정 타입
export type EmotionType =
  | "happy"
  | "sad"
  | "anxious"
  | "tired"
  | "touched"
  | "loving"
  | "lonely"
  | "calm"
  | "neutral";

// 감정별 색상 - earthy, muted watercolor tones
export const EMOTION_COLORS: Record<EmotionType, string> = {
  happy: "#C67D5B",   // terracotta warm
  sad: "#8B9EB0",     // dusty steel blue
  anxious: "#C9A961", // warm ochre
  tired: "#B0A4A0",   // warm dusty
  touched: "#A8603D", // deep clay
  loving: "#C9A0A0",  // muted blush
  lonely: "#8B7B8E",  // muted mauve
  calm: "#8FA68A",    // sage
  neutral: "#A69580", // cocoa muted
};

// 감정 한글 라벨
export const EMOTION_LABELS: Record<EmotionType, string> = {
  happy: "행복",
  sad: "슬픔",
  anxious: "불안",
  tired: "피곤",
  touched: "감동",
  loving: "사랑",
  lonely: "외로움",
  calm: "평온",
  neutral: "보통",
};

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 페이지네이션 응답
export interface PagedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// 채팅 메시지
export interface ChatMessage {
  sender: "user" | "ai";
  content: string;
  timestamp?: Date;
}

// 로그인 요청
export interface LoginRequest {
  username: string;
  password: string;
}

// 회원가입 요청
export interface SignupRequest {
  username: string;
  password: string;
  email: string;
  phone: string;
}

// 인증 응답
export interface AuthResponse {
  id: number;
  token: string;
  username: string;
  email: string;
  role: string;
  child?: ChildInfo;
}

// 일기 생성 요청
export interface CreateDiaryRequest {
  title: string;
  content: string;
  emotion: string;
}

// AI 분석 응답
export interface AIAnalysisResponse {
  emotion: EmotionType;
  response: string;
}
