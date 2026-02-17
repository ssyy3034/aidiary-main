import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import FormInput from './common/FormInput';
import useFormValidation, { FormData, initialFormData } from '../hooks/useFormValidation';

interface RegisterProps {
    onRegister: (username: string, password: string, email: string, phone: string) => Promise<void> | void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
    const [form, setForm] = useState<FormData>(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const { errors, isValid } = useFormValidation(form);
    const navigate = useNavigate();

    const updateField = (field: keyof FormData) => (value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        setIsLoading(true);
        try {
            await onRegister(form.username, form.password, form.email, form.phone);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-5 bg-linen py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-full max-w-sm"
            >
                <div className="bg-white border border-linen-deep rounded-lg shadow-paper p-7 relative">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-terra/0 via-terra/40 to-terra/0 rounded-t-lg" />

                    <div className="mb-7">
                        <button
                            onClick={() => navigate('/login')}
                            className="mb-4 p-1 -ml-1 text-cocoa-muted hover:text-terra transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="font-display text-[22px] font-bold text-ink">
                            새로운 시작
                        </h2>
                        <p className="text-[13px] text-cocoa-muted mt-1">
                            산모일기와 함께하는 특별한 여정
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <FormInput
                            id="username" label="아이디" type="text"
                            placeholder="영문자와 숫자만 (3자 이상)"
                            value={form.username} onChange={updateField('username')}
                            error={errors.username} disabled={isLoading}
                        />
                        <FormInput
                            id="password" label="비밀번호" type="password"
                            placeholder="8자 이상 (특수문자 포함)"
                            value={form.password} onChange={updateField('password')}
                            error={errors.password} disabled={isLoading} showPasswordToggle
                        />
                        <FormInput
                            id="confirmPassword" label="비밀번호 확인" type="password"
                            placeholder="비밀번호를 다시 입력해주세요"
                            value={form.confirmPassword} onChange={updateField('confirmPassword')}
                            error={errors.confirmPassword} disabled={isLoading} showPasswordToggle
                        />
                        <FormInput
                            id="email" label="이메일" type="email"
                            placeholder="example@email.com"
                            value={form.email} onChange={updateField('email')}
                            error={errors.email} disabled={isLoading}
                        />
                        <FormInput
                            id="phone" label="전화번호" type="tel"
                            placeholder="01012345678"
                            value={form.phone} onChange={updateField('phone')}
                            error={errors.phone} disabled={isLoading}
                        />

                        <div className="pt-3 space-y-3">
                            <button
                                type="submit"
                                disabled={!isValid || isLoading}
                                className="w-full py-3 px-4 text-[14px] font-bold rounded-md text-white bg-terra hover:bg-terra-dark active:bg-terra-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                            >
                                {isLoading ? '가입 처리 중...' : '회원가입'}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                disabled={isLoading}
                                className="w-full py-2.5 text-[13px] text-cocoa-muted hover:text-terra transition-colors"
                            >
                                이미 계정이 있으신가요? <span className="font-bold underline underline-offset-2">로그인</span>
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
