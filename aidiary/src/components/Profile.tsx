import React, { useState, useMemo } from 'react';
import FormInput from './common/FormInput';
import './Profile.css';
import type { UserProfile, ChildInfo } from '../types';

interface ProfileProps {
    userInfo: UserProfile;
    onUpdateProfile: (profile: UserProfile) => Promise<void> | void;
    onDeleteAccount: () => Promise<void> | void;
}

const DEFAULT_CHILD: ChildInfo = { childName: '', meetDate: '' };

const Profile: React.FC<ProfileProps> = ({ userInfo, onUpdateProfile, onDeleteAccount }) => {
    // 편집 모드 상태
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 편집 중인 프로필 (편집 모드에서만 사용)
    const [editedProfile, setEditedProfile] = useState<UserProfile>({
        ...userInfo,
        child: userInfo.child ?? DEFAULT_CHILD,
    });

    // 편집 시작
    const handleEdit = () => {
        setEditedProfile({
            ...userInfo,
            child: userInfo.child ?? DEFAULT_CHILD,
        });
        setIsEditing(true);
    };

    // 필드 업데이트 헬퍼
    const updateField = (field: keyof UserProfile) => (value: string) => {
        setEditedProfile(prev => ({ ...prev, [field]: value }));
    };

    // 저장
    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onUpdateProfile(editedProfile);
            setIsEditing(false);
        } finally {
            setIsLoading(false);
        }
    };

    // 삭제
    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await onDeleteAccount();
        } finally {
            setIsLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    // 표시할 정보 (비밀번호 제외!)
    const displayInfo = useMemo(() => [
        { label: '이메일', value: userInfo.email },
        { label: '전화번호', value: userInfo.phone || '-' },
    ], [userInfo.email, userInfo.phone]);

    return (
        <div className="min-h-screen py-6 px-4 bg-paper">
            <div className="max-w-2xl mx-auto">
                {/* 헤더 */}
                <h1 className="text-3xl font-bold text-center mb-6 text-primary font-serif">
                    프로필 관리
                </h1>

                {/* 프로필 카드 */}
                <div className="bg-white rounded-2xl p-6 shadow-card border border-sand">
                    {/* 사용자 정보 헤더 */}
                    <div className="flex items-center mb-6">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4 bg-primary">
                            {userInfo.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-ink">
                                {userInfo.username}
                            </h2>
                            <p className="text-ink-light">{userInfo.email}</p>
                        </div>
                    </div>

                    <hr className="mb-6 border-sand" />

                    {/* 보기 모드 */}
                    {!isEditing ? (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-ink">
                                    개인정보
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleEdit}
                                        className="px-4 py-2 rounded-xl border border-primary text-primary hover:bg-primary/5 transition-colors"
                                    >
                                        ✏️ 수정
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="px-4 py-2 rounded-xl border border-error text-error hover:bg-error/5 transition-colors"
                                    >
                                        🗑️ 계정 삭제
                                    </button>
                                </div>
                            </div>

                            <div className="bg-paper-dark/50 rounded-xl p-4">
                                {displayInfo.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex mb-3 last:mb-0"
                                    >
                                        <span className="w-24 text-ink-light font-medium">
                                            {item.label}
                                        </span>
                                        <span className="text-ink">
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* 편집 모드 */
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-primary">
                                정보 수정
                            </h3>

                            <div className="space-y-4">
                                <FormInput
                                    id="email"
                                    label="이메일"
                                    type="email"
                                    placeholder="이메일을 입력하세요"
                                    value={editedProfile.email}
                                    onChange={updateField('email')}
                                    disabled={isLoading}
                                />

                                <FormInput
                                    id="phone"
                                    label="전화번호"
                                    type="tel"
                                    placeholder="'-' 없이 숫자만"
                                    value={editedProfile.phone}
                                    onChange={updateField('phone')}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    disabled={isLoading}
                                    className="px-4 py-2 rounded-xl border border-sand-dark text-ink-light hover:bg-sand/50 transition-colors disabled:opacity-50"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="px-4 py-2 rounded-xl text-white bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? '저장 중...' : '💾 저장'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 삭제 확인 모달 */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-ink-dark/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-float">
                            <h3 className="text-xl font-bold text-error mb-4">
                                ⚠️ 계정 삭제 확인
                            </h3>
                            <p className="text-ink-light mb-6">
                                정말로 계정을 삭제하시겠습니까?
                                <br />
                                <strong className="text-error">
                                    이 작업은 되돌릴 수 없습니다.
                                </strong>
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isLoading}
                                    className="px-4 py-2 rounded-xl text-ink-light hover:bg-sand/50 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    className="px-4 py-2 rounded-xl bg-error text-white hover:bg-error/90 transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? '삭제 중...' : '🗑️ 삭제'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
