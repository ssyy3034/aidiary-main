import React, { useState } from "react";
import DiaryForm from "./DiaryForm";
import DiaryCard from "./DiaryCard";
import EditModal from "./EditModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import useDiary from "../../hooks/useDiary";
import type { DiaryEntry, EmotionType } from "../../types";
import "./Diary.css";

const Diary: React.FC = () => {
  const {
    entries, page, totalPages, isLoading, dailyPrompt,
    loadingResponses, fetchEntries, createEntry, updateEntry,
    deleteEntry, getAIAnalysis, getDiaryDrawing,
  } = useDiary();

  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<DiaryEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingEntry) return;
    setIsDeleting(true);
    try { await deleteEntry(deletingEntry.id); setDeletingEntry(null); }
    finally { setIsDeleting(false); }
  };

  const handleUpdate = async (
    id: number, data: { title: string; content: string; emotion: EmotionType },
  ) => updateEntry(id, data);

  return (
    <div className="min-h-screen py-6 px-5 max-w-lg mx-auto pb-28">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] font-display font-bold text-ink mb-1">
          일기장
        </h1>
        <p className="text-cocoa-muted text-[13px]">
          매일 자라나는 소중한 순간들을 기록해요
        </p>
      </div>

      {/* Form */}
      <div className="mb-8">
        <DiaryForm dailyPrompt={dailyPrompt} isLoading={isLoading} onSubmit={createEntry} />
      </div>

      {/* Entries */}
      <div className="diary-grid">
        {isLoading && entries.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-white rounded-lg p-5 shadow-paper border border-linen-deep h-[200px] animate-pulse">
              <div className="h-4 w-20 bg-linen-deep rounded mb-4" />
              <div className="h-3 w-full bg-linen-dark rounded mb-2" />
              <div className="h-3 w-3/4 bg-linen-dark rounded" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[48px] mb-3">📔</p>
            <p className="text-ink font-display font-bold text-lg">아직 작성된 일기가 없어요</p>
            <p className="text-cocoa-muted text-[13px] mt-1">위에서 첫 번째 일기를 써보세요</p>
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
                onGetDrawing={() => getDiaryDrawing(entry.id, entry.content)}
              />
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-6 mt-8">
          <button
            onClick={() => fetchEntries(page - 1)} disabled={page === 0}
            className="text-[13px] text-cocoa-muted hover:text-terra disabled:opacity-25 transition-colors font-bold"
          >&larr; 이전</button>
          <span className="text-[14px] font-display font-bold text-ink">
            {page + 1} <span className="text-cocoa-muted font-normal">/ {totalPages}</span>
          </span>
          <button
            onClick={() => fetchEntries(page + 1)} disabled={page + 1 >= totalPages}
            className="text-[13px] text-cocoa-muted hover:text-terra disabled:opacity-25 transition-colors font-bold"
          >다음 &rarr;</button>
        </div>
      )}

      <EditModal entry={editingEntry} isOpen={!!editingEntry} onClose={() => setEditingEntry(null)} onSave={handleUpdate} />
      <DeleteConfirmModal isOpen={!!deletingEntry} isLoading={isDeleting} onClose={() => setDeletingEntry(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default Diary;
