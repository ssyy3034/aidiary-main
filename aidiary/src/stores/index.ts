import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, CharacterData, AuthState } from '../types';

/**
 * 인증 상태 관리 스토어
 */
interface AuthStore extends AuthState {
    // Actions
    login: (token: string, user: UserProfile) => void;
    logout: () => void;
    setCharacter: (character: CharacterData) => void;
    updateUserInfo: (user: UserProfile) => void;
    clearCharacter: () => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            // Initial state
            isAuthenticated: false,
            hasCharacter: false,
            characterData: null,
            userInfo: null,

            // Actions
            login: (token: string, user: UserProfile) => {
                localStorage.setItem('token', token);
                set({
                    isAuthenticated: true,
                    userInfo: user,
                });
            },

            logout: () => {
                localStorage.removeItem('token');
                set({
                    isAuthenticated: false,
                    hasCharacter: false,
                    characterData: null,
                    userInfo: null,
                });
            },

            setCharacter: (character: CharacterData) => {
                set({
                    hasCharacter: true,
                    characterData: character,
                });
            },

            updateUserInfo: (user: UserProfile) => {
                set({ userInfo: user });
            },

            clearCharacter: () => {
                set({
                    hasCharacter: false,
                    characterData: null,
                });
            },
        }),
        {
            name: 'auth-storage', // localStorage key
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                hasCharacter: state.hasCharacter,
                characterData: state.characterData,
                userInfo: state.userInfo,
            }),
        }
    )
);

/**
 * UI 상태 관리 스토어 (로딩, 에러 등)
 */
interface UIStore {
    isLoading: boolean;
    error: string | null;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isLoading: false,
    error: null,

    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setError: (error: string | null) => set({ error }),
    clearError: () => set({ error: null }),
}));

/**
 * 일기 관련 상태 관리
 */
interface DiaryStore {
    currentPage: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
    setTotalPages: (total: number) => void;
}

export const useDiaryStore = create<DiaryStore>((set) => ({
    currentPage: 0,
    totalPages: 0,

    setCurrentPage: (page: number) => set({ currentPage: page }),
    setTotalPages: (total: number) => set({ totalPages: total }),
}));
