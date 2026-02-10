import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { diaryApi } from '../api/client';
import type { DiaryEntry, EmotionType, AIAnalysisResponse } from '../types';

const FLASK_API_URL = process.env.REACT_APP_FACE_API_URL || 'http://localhost:5001';

interface UseDiaryReturn {
    // 상태
    entries: DiaryEntry[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    dailyPrompt: string;
    loadingResponses: Record<number, boolean>;

    // 액션
    fetchEntries: (pageParam?: number) => Promise<void>;
    createEntry: (content: string) => Promise<boolean>;
    updateEntry: (id: number, data: { title: string; content: string; emotion: EmotionType }) => Promise<boolean>;
    deleteEntry: (id: number) => Promise<boolean>;
    getAIAnalysis: (entryId: number, content: string) => Promise<void>;
}

/**
 * 일기 관련 비즈니스 로직을 캡슐화하는 커스텀 훅
 */
export const useDiary = (): UseDiaryReturn => {
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [dailyPrompt, setDailyPrompt] = useState('');
    const [loadingResponses, setLoadingResponses] = useState<Record<number, boolean>>({});

    // 일기 목록 조회
    const fetchEntries = useCallback(async (pageParam = 0, size = 4) => {
        setIsLoading(true);
        try {
            const response = await diaryApi.getAll(pageParam, size);
            const { content, totalPages: total, number } = response.data;

            const mappedEntries: DiaryEntry[] = content.map((item: any) => ({
                id: item.id,
                title: item.title,
                content: item.content,
                emotion: item.emotion || 'calm',
                createdAt: item.createdAt,
            }));

            setEntries(mappedEntries);
            setPage(number);
            setTotalPages(total);
            console.log(`[📘 ${content.length}개 일기 불러옴] 현재 페이지: ${number + 1}/${total}`);
        } catch (error) {
            console.error('일기 불러오기 실패:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 오늘의 질문 조회
    const fetchDailyPrompt = useCallback(async () => {
        try {
            const response = await axios.get(`${FLASK_API_URL}/api/daily-question`);
            setDailyPrompt(response.data.question);
        } catch (error) {
            console.error('오늘의 질문 불러오기 실패:', error);
            setDailyPrompt('오늘 어떤 생각이 들었나요?');
        }
    }, []);

    // 초기 데이터 로드
    useEffect(() => {
        fetchEntries();
        fetchDailyPrompt();
    }, [fetchEntries, fetchDailyPrompt]);

    // 일기 생성
    const createEntry = useCallback(async (content: string): Promise<boolean> => {
        if (!content.trim()) return false;

        setIsLoading(true);
        try {
            await diaryApi.create({
                title: '일기',
                content,
                emotion: 'calm',
            });
            await fetchEntries();
            return true;
        } catch (error) {
            console.error('일기 작성 실패:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [fetchEntries]);

    // 일기 수정
    const updateEntry = useCallback(async (
        id: number,
        data: { title: string; content: string; emotion: EmotionType }
    ): Promise<boolean> => {
        try {
            await diaryApi.update(id, data);
            await fetchEntries(page);
            return true;
        } catch (error) {
            console.error('일기 수정 실패:', error);
            return false;
        }
    }, [fetchEntries, page]);

    // 일기 삭제
    const deleteEntry = useCallback(async (id: number): Promise<boolean> => {
        try {
            await diaryApi.delete(id);
            await fetchEntries(page);
            return true;
        } catch (error) {
            console.error('일기 삭제 실패:', error);
            return false;
        }
    }, [fetchEntries, page]);

    // AI 분석 요청
    const getAIAnalysis = useCallback(async (entryId: number, content: string) => {
        setLoadingResponses(prev => ({ ...prev, [entryId]: true }));

        try {
            const response = await axios.post<AIAnalysisResponse>(
                `${FLASK_API_URL}/api/openai`,
                { prompt: content }
            );

            const { emotion, response: aiResponse } = response.data;

            setEntries(prev =>
                prev.map(entry =>
                    entry.id === entryId
                        ? { ...entry, emotion: emotion || 'calm', aiResponse: aiResponse || '응원할게요!' }
                        : entry
                )
            );
        } catch (error) {
            console.error('AI 응답 실패:', error);
            setEntries(prev =>
                prev.map(entry =>
                    entry.id === entryId
                        ? { ...entry, aiResponse: '응답 생성 실패' }
                        : entry
                )
            );
        } finally {
            setLoadingResponses(prev => ({ ...prev, [entryId]: false }));
        }
    }, []);

    return {
        entries,
        page,
        totalPages,
        isLoading,
        dailyPrompt,
        loadingResponses,
        fetchEntries,
        createEntry,
        updateEntry,
        deleteEntry,
        getAIAnalysis,
    };
};

export default useDiary;
