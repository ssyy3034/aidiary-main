import React, { useState } from 'react';
import DiaryForm from './DiaryForm';
import DiaryCard from './DiaryCard';
import EditModal from './EditModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import useDiary from '../../hooks/useDiary';
import type { DiaryEntry, EmotionType } from '../../types';
import './Diary.css';

/**
 * 일기 페이지 메인 컴포넌트
 * - Tailwind CSS로 리팩토링 및 프리미엄 디자인 적용
 */
const Diary: React.FC = () => {
    // 커스텀 훅에서 상태와 액션 가져오기
    const {
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
    } = useDiary();

    // 모달 상태
    const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
    const [deletingEntry, setDeletingEntry] = useState<DiaryEntry | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 삭제 핸들러
    const handleDelete = async () => {
        if (!deletingEntry) return;
        setIsDeleting(true);
        try {
            await deleteEntry(deletingEntry.id);
            setDeletingEntry(null);
        } finally {
            setIsDeleting(false);
        }
    };

    // 수정 핸들러
    const handleUpdate = async (
        id: number,
        data: { title: string; content: string; emotion: EmotionType }
    ) => {
        return updateEntry(id, data);
    };

    return (
        <div className="min-h-screen py-10 px-4 max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
                <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                    오늘의 기록
                </span>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink mb-3">
                    우리 아이 성장 일기
                </h1>
                <p className="text-ink-light font-serif italic">
                    "매일매일 자라나는 소중한 순간들을 기록해요"
                </p>
            </div>

                {/* 일기 작성 폼 */}
                <div className="mb-8">
                    <DiaryForm
                        dailyPrompt={dailyPrompt}
                        isLoading={isLoading}
                        onSubmit={createEntry}
                    />
                </div>

                {/* 일기 목록 */}
                <div className="diary-grid">
                    {entries.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📝</div>
                            <p>아직 작성된 일기가 없어요.</p>
                            <p className="text-sm mt-2">첫 번째 일기를 작성해보세요!</p>
                        </div>
                    ) : (
                        entries.map((entry) => (
                            <div key={entry.id} className="diary-card-enter">
                                <DiaryCard
                                    entry={entry}
                                    isLoadingAI={loadingResponses[entry.id] || false}
                                    onEdit={() => setEditingEntry(entry)}
                                    onDelete={() => setDeletingEntry(entry)}
                                    onRequestAI={() => getAIAnalysis(entry.id, entry.content)}
                                />
                            </div>
                        ))
                    )}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <button
                            onClick={() => fetchEntries(page - 1)}
                            disabled={page === 0}
                            className="px-4 py-2 rounded-lg text-ink-light hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            ← 이전
                        </button>
                        <span className="text-primary font-medium">
                            {page + 1} / {totalPages}
                        </span>
                        <button
                            onClick={() => fetchEntries(page + 1)}
                            disabled={page + 1 >= totalPages}
                            className="px-4 py-2 rounded-lg text-ink-light hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            다음 →
                        </button>
                    </div>
                )}
            {/* 수정 모달 */}
            <EditModal
                entry={editingEntry}
                isOpen={!!editingEntry}
                onClose={() => setEditingEntry(null)}
                onSave={handleUpdate}
            />

            {/* 삭제 확인 모달 */}
            <DeleteConfirmModal
                isOpen={!!deletingEntry}
                isLoading={isDeleting}
                onClose={() => setDeletingEntry(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default Diary;
