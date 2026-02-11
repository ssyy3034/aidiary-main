import React, { useState, useEffect } from 'react';
import { THEME_COLORS } from '../common/FormInput';
import type { DiaryEntry, EmotionType } from '../../types';

interface EditModalProps {
    entry: DiaryEntry | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, data: { title: string; content: string; emotion: EmotionType }) => Promise<boolean>;
}

/**
 * 일기 수정 모달 컴포넌트
 */
const EditModal: React.FC<EditModalProps> = ({ entry, isOpen, onClose, onSave }) => {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { sub: subColor } = THEME_COLORS;

    // entry가 변경되면 content 초기화
    useEffect(() => {
        if (entry) {
            setContent(entry.content);
        }
    }, [entry]);

    if (!isOpen || !entry) return null;

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const success = await onSave(entry.id, {
                title: entry.title,
                content,
                emotion: entry.emotion,
            });
            if (success) {
                onClose();
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
                className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div
                    className="px-6 py-4 border-b"
                    style={{ borderColor: `${subColor}20` }}
                >
                    <h2 className="text-xl font-bold" style={{ color: subColor }}>
                        일기 수정
                    </h2>
                </div>

                {/* 내용 */}
                <div className="p-6">
                    <textarea
                        className="w-full h-40 p-4 rounded-xl resize-none focus:outline-none focus:ring-2 transition-all duration-200"
                        style={{
                            backgroundColor: '#fafafa',
                            borderColor: `${subColor}40`,
                            borderWidth: '1px',
                        }}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                {/* 푸터 버튼 */}
                <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: `${subColor}20` }}>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-5 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-5 py-2 rounded-xl text-white font-medium transition-colors disabled:opacity-50 hover:shadow-lg"
                        style={{ backgroundColor: subColor }}
                    >
                        {isLoading ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditModal;
