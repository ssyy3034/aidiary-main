import React from 'react';
import dayjs from 'dayjs';
import type { DiaryEntry } from '../../types';
import { EMOTION_COLORS, EMOTION_LABELS } from '../../types';

interface DiaryCardProps {
    entry: DiaryEntry;
    isLoadingAI: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onRequestAI: () => void;
}

/**
 * 일기 카드 컴포넌트
 */
const DiaryCard: React.FC<DiaryCardProps> = ({
    entry,
    isLoadingAI,
    onEdit,
    onDelete,
    onRequestAI,
}) => {
    const emotionColor = EMOTION_COLORS[entry.emotion] || EMOTION_COLORS.calm;
    const emotionLabel = EMOTION_LABELS[entry.emotion] || EMOTION_LABELS.calm;

    return (
        <div className="bg-white rounded-2xl p-5 shadow-soft transition-all duration-200 hover:shadow-card border border-sand/50">
            {/* 헤더: 날짜 + 액션 버튼 */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-ink-light">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">
                        {dayjs(entry.createdAt).format('YYYY년 MM월 DD일 HH:mm')}
                    </span>
                </div>

                <div className="flex gap-1">
                    <button
                        onClick={onEdit}
                        className="p-2 rounded-full hover:bg-sand/50 transition-colors text-primary"
                        title="수정"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-full hover:bg-error/10 transition-colors text-error"
                        title="삭제"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* 일기 내용 */}
            <p className="text-ink whitespace-pre-wrap leading-relaxed mb-4">
                {entry.content}
            </p>

            {/* 감정 태그 */}
            <div className="flex items-center gap-2 mb-4">
                <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm text-white"
                    style={{ backgroundColor: emotionColor }}
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    {emotionLabel}
                </span>
            </div>

            {/* AI 분석 버튼 */}
            <div className="pt-3 border-t border-sand/50">
                <button
                    onClick={onRequestAI}
                    disabled={isLoadingAI}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-primary text-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50"
                >
                    {isLoadingAI ? '불러오는 중...' : '👶 태아의 반응 보기'}
                </button>

                {/* AI 응답 */}
                {entry.aiResponse && (
                    <div
                        className="mt-3 p-3 rounded-lg italic text-sm border border-secondary/20"
                        style={{ backgroundColor: '#FAF6F0', color: '#5C6B4D' }}
                    >
                        👶 {entry.aiResponse}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiaryCard;
