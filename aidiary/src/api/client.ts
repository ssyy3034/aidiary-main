import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// API Base URL — 모든 요청이 Spring Boot(BFF)를 통해 전달됨
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

/**
 * 메인 백엔드 API 클라이언트
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {},
  timeout: 120000, // 120초 (t3.small에서의 이미지 생성 소요 시간 고려)
});

/**
 * 요청 인터셉터: 토큰 자동 추가
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * 응답 인터셉터: 에러 처리
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // 인증 만료 시 Zustand 상태 + localStorage 모두 초기화 후 리다이렉트
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("auth-storage"); // Zustand persist 상태 제거
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

// API 엔드포인트 헬퍼 함수들
export const authApi = {
  login: (data: { username: string; password: string }) =>
    apiClient.post("/api/auth/login", data),
  signup: (data: {
    name: string;
    username: string;
    password: string;
    email: string;
    phone: string;
  }) => apiClient.post("/api/auth/signup", data),
  logout: () => apiClient.post("/api/auth/logout"),
};

export const userApi = {
  getInfo: () => apiClient.get("/api/user/info"),
  updateProfile: (data: any) => apiClient.patch("/api/user/profile", data),
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put("/api/user/update-password", data),
  deleteAccount: () => apiClient.delete("/api/user/delete"),
};

export const diaryApi = {
  getAll: (page: number = 0, size: number = 10) =>
    apiClient.get(`/api/diary?page=${page}&size=${size}`),
  create: (data: { title: string; content: string; emotion: string }) =>
    apiClient.post("/api/diary", data),
  update: (
    id: number,
    data: { title: string; content: string; emotion: string },
  ) => apiClient.put(`/api/diary/${id}`, data),
  updateEmotion: (id: number, emotion: string) =>
    apiClient.patch(`/api/diary/${id}/emotion`, { emotion }),
  delete: (id: number) => apiClient.delete(`/api/diary/${id}`),
};

export const childApi = {
  getMe: () => apiClient.get("/api/child/me"),
  save: (data: any) => apiClient.post("/api/child/save", data),
};

export const chatApi = {
  send: (message: string, context?: string) =>
    apiClient.post("/api/chat", { message, context }),
};

/**
 * Diary AI API — Flask 프록시 (Spring Boot BFF 경유)
 */
export const diaryAiApi = {
  getDailyQuestion: () => apiClient.get("/api/diary-ai/daily-question"),
  analyzeEmotion: (prompt: string) =>
    apiClient.post("/api/diary-ai/emotion-analysis", { prompt }),
  getFaceLandmarks: (image: string) =>
    apiClient.post("/api/diary-ai/face-landmarks", { image }),
  generateDrawing: (diaryText: string) =>
    apiClient.post(
      "/api/diary-ai/drawing",
      { diary_text: diaryText },
      { timeout: 120000 },
    ),
  getImageUrl: (filename: string) =>
    `${API_BASE_URL}/api/diary-ai/images/${filename}`,
};

/**
 * Image API — 캐릭터 이미지 분석 (Spring Boot BFF 경유)
 */
export const imageApi = {
  analyze: (formData: FormData) =>
    apiClient.post("/api/images/analyze", formData, {
      timeout: 120000,
    }),
  getStatus: (jobId: string) => apiClient.get(`/api/images/status/${jobId}`),
  getResult: (jobId: string) =>
    apiClient.get(`/api/images/result/${jobId}`, {
      responseType: "blob",
    }),
};

export const fetalApi = {
  log: (data: { movementTime: string; intensity: number; notes?: string }) =>
    apiClient.post("/api/fetal-movement", data),
  getToday: () => apiClient.get("/api/fetal-movement/today"),
  getHistory: (date?: string, page = 0, size = 20) =>
    apiClient.get(
      `/api/fetal-movement/history?page=${page}&size=${size}${date ? `&date=${date}` : ""}`,
    ),
  delete: (id: number) => apiClient.delete(`/api/fetal-movement/${id}`),
};

export const healthApi = {
  save: (data: {
    recordDate?: string;
    weight?: number;
    systolic?: number;
    diastolic?: number;
  }) => apiClient.post("/api/health", data),
  getHistory: () => apiClient.get("/api/health/history"),
  getLatest: () => apiClient.get("/api/health/latest"),
};

export const pregnancyApi = {
  getCurrentWeek: () => apiClient.get("/api/pregnancy/current"),
  getWeek: (week: number) => apiClient.get(`/api/pregnancy/${week}`),
};

export const personalityApi = {
  chat: (data: {
    message: string;
    history: { role: string; content: string }[];
    parent_label: string;
    turn_count: number;
  }) => apiClient.post("/api/personality/chat", data),

  synthesize: (data: {
    parent1_history: { role: string; content: string }[];
    parent2_history: { role: string; content: string }[];
  }) => apiClient.post("/api/personality/synthesize", data),
};

export const benefitsApi = {
  getBenefits: (week?: number) =>
    apiClient.get(`/api/benefits${week ? `?week=${week}` : ""}`),
  toggleCheck: (benefitId: number) =>
    apiClient.post(`/api/benefits/${benefitId}/check`),
};

export default apiClient;
