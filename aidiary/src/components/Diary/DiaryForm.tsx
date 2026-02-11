import React, { useState } from 'react';

interface DiaryFormProps {
    dailyPrompt: string;
    isLoading: boolean;
    onSubmit: (content: string) => Promise<boolean>;
}

/**
 * 일기 작성 폼 컴포넌트
 */
const DiaryForm: React.FC<DiaryFormProps> = ({ dailyPrompt, isLoading, onSubmit }) => {
    const [content, setContent] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        const success = await onSubmit(content);
        if (success) {
            setContent('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const addPromptToContent = () => {
        setContent(prev => `${dailyPrompt}\n${prev}`);
    };

    return (
        <div className="space-y-3">
            {/* 오늘의 질문 */}
            {dailyPrompt && (
                <div
                    className="p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md bg-paper border-l-[6px] border-l-secondary"
                    onClick={addPromptToContent}
                >
                    <p className="font-medium text-secondary-dark">
                        ✨ 오늘의 질문: {dailyPrompt}
                    </p>
                    <p className="text-sm text-ink-light mt-1">
                        (눌러서 일기에 추가할 수 있어요)
                    </p>
                </div>
            )}

            {/* 일기 작성 폼 */}
            <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-sand">
                    <textarea
                        className="w-full h-32 p-4 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-paper-dark/30 border border-sand text-ink placeholder:text-ink-light/60"
                        placeholder="당신의 생각을 들려주세요"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={isLoading}
                        autoFocus
                    />

                    <button
                        type="submit"
                        disabled={isLoading || !content.trim()}
                        className="w-full mt-4 py-3 px-6 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg bg-primary hover:bg-primary-dark"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                기록 중...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                기록하기
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DiaryForm;
