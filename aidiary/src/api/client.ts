import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Base URLs
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const FACE_API_URL = process.env.REACT_APP_FACE_API_URL || 'http://localhost:5001';

/**
 * 메인 백엔드 API 클라이언트
 */
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30초
});

/**
 * Flask Face API 클라이언트
 */
export const faceApiClient: AxiosInstance = axios.create({
    baseURL: FACE_API_URL,
    timeout: 60000, // 60초 (이미지 처리는 시간이 오래 걸릴 수 있음)
});

/**
 * 요청 인터셉터: 토큰 자동 추가
 */
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

/**
 * 응답 인터셉터: 에러 처리
 */
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // 인증 만료 시 로그인 페이지로 리다이렉트
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// API 엔드포인트 헬퍼 함수들
export const authApi = {
    login: (data: { username: string; password: string }) =>
        apiClient.post('/api/auth/login', data),
    signup: (data: { username: string; password: string; email: string; phone: string }) =>
        apiClient.post('/api/auth/signup', data),
    logout: () => apiClient.post('/api/auth/logout'),
};

export const userApi = {
    getInfo: () => apiClient.get('/api/user/info'),
    updateProfile: (data: any) => apiClient.patch('/api/user/profile', data),
    updatePassword: (data: { currentPassword: string; newPassword: string }) =>
        apiClient.put('/api/user/update-password', data),
    deleteAccount: () => apiClient.delete('/api/user/delete'),
};

export const diaryApi = {
    getAll: (page: number = 0, size: number = 10) =>
        apiClient.get(`/api/diary?page=${page}&size=${size}`),
    create: (data: { title: string; content: string; emotion: string }) =>
        apiClient.post('/api/diary', data),
    update: (id: number, data: { title: string; content: string; emotion: string }) =>
        apiClient.put(`/api/diary/${id}`, data),
    delete: (id: number) => apiClient.delete(`/api/diary/${id}`),
};

export const childApi = {
    getMe: () => apiClient.get('/api/child/me'),
    save: (data: any) => apiClient.post('/api/child/save', data),
};

export const chatApi = {
    send: (message: string, context?: string) =>
        apiClient.post('/api/chat', { message, context }),
};

export default apiClient;
