import React from 'react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    isLoading: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

/**
 * 삭제 확인 모달 컴포넌트
 */
const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    isLoading,
    onClose,
    onConfirm,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold text-red-500 mb-4">
                    ⚠️ 삭제 확인
                </h3>
                <p className="text-gray-600 mb-6">
                    정말로 이 일기를 삭제하시겠습니까?
                    <br />
                    <strong className="text-red-500">
                        이 작업은 되돌릴 수 없습니다.
                    </strong>
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-5 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-5 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? '삭제 중...' : '🗑️ 삭제'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
