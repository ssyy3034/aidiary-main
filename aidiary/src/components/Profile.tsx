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
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editedProfile, setEditedProfile] = useState<UserProfile>({
        ...userInfo, child: userInfo.child ?? DEFAULT_CHILD,
    });

    const handleEdit = () => {
        setEditedProfile({ ...userInfo, child: userInfo.child ?? DEFAULT_CHILD });
        setIsEditing(true);
    };

    const updateField = (field: keyof UserProfile) => (value: string) => {
        setEditedProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try { await onUpdateProfile(editedProfile); setIsEditing(false); }
        finally { setIsLoading(false); }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try { await onDeleteAccount(); }
        finally { setIsLoading(false); setShowDeleteConfirm(false); }
    };

    const displayInfo = useMemo(() => [
        { label: '이메일', value: userInfo.email },
        { label: '전화번호', value: userInfo.phone || '-' },
    ], [userInfo.email, userInfo.phone]);

    return (
        <div className="min-h-screen py-6 px-5 max-w-lg mx-auto pb-28">
            <h1 className="text-[24px] font-display font-bold text-ink mb-6">프로필</h1>

            <div className="bg-white border border-linen-deep rounded-lg shadow-paper p-5">
                {/* User header */}
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-lg bg-linen-dark flex items-center justify-center text-terra text-xl font-display font-bold border border-linen-deep">
                        {userInfo.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-[17px] font-display font-bold text-ink">{userInfo.username}</h2>
                        <p className="text-cocoa-muted text-[13px]">{userInfo.email}</p>
                    </div>
                </div>

                <hr className="mb-5 border-linen-deep" />

                {!isEditing ? (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[14px] font-bold text-ink">개인정보</h3>
                            <div className="flex gap-2">
                                <button onClick={handleEdit} className="px-3 py-1.5 text-[12px] font-bold rounded-md border border-terra/30 text-terra hover:bg-terra/5 transition-colors">
                                    수정
                                </button>
                                <button onClick={() => setShowDeleteConfirm(true)} className="px-3 py-1.5 text-[12px] font-bold rounded-md border border-red-300/50 text-red-400 hover:bg-red-50 transition-colors">
                                    삭제
                                </button>
                            </div>
                        </div>

                        <div className="bg-linen/50 rounded-md p-4 space-y-2.5">
                            {displayInfo.map((item, i) => (
                                <div key={i} className="flex">
                                    <span className="w-20 text-cocoa-muted text-[13px] font-bold">{item.label}</span>
                                    <span className="text-ink text-[13px]">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-[14px] font-bold text-ink mb-4">정보 수정</h3>
                        <div className="space-y-4">
                            <FormInput id="email" label="이메일" type="email" placeholder="이메일" value={editedProfile.email} onChange={updateField('email')} disabled={isLoading} />
                            <FormInput id="phone" label="전화번호" type="tel" placeholder="숫자만" value={editedProfile.phone} onChange={updateField('phone')} disabled={isLoading} />
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setIsEditing(false)} disabled={isLoading}
                                className="px-4 py-2 text-[13px] rounded-md text-cocoa-muted hover:bg-linen-dark transition-colors disabled:opacity-50">취소</button>
                            <button onClick={handleSave} disabled={isLoading}
                                className="px-4 py-2 text-[13px] font-bold rounded-md text-white bg-terra hover:bg-terra-dark transition-colors disabled:opacity-50">
                                {isLoading ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lifted border border-linen-deep">
                        <h3 className="text-[17px] font-display font-bold text-red-500 mb-3">계정 삭제</h3>
                        <p className="text-cocoa text-[14px] mb-5 leading-relaxed">
                            정말로 계정을 삭제하시겠습니까?<br />
                            <strong className="text-red-400">이 작업은 되돌릴 수 없습니다.</strong>
                        </p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowDeleteConfirm(false)} disabled={isLoading}
                                className="px-4 py-2 text-[13px] text-cocoa-muted hover:bg-linen-dark rounded-md transition-colors">취소</button>
                            <button onClick={handleDelete} disabled={isLoading}
                                className="px-4 py-2 text-[13px] font-bold rounded-md bg-red-400 text-white hover:bg-red-500 transition-colors disabled:opacity-50">
                                {isLoading ? '삭제 중...' : '삭제'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
