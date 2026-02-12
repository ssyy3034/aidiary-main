import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';
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
        <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-paper relative overflow-hidden">
             {/* Background Decoration - Warm botanical gradients */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-primary/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] bg-secondary/15 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-[80px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="max-w-md w-full relative z-10"
            >
                <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-card rounded-2xl p-8 sm:p-10 relative overflow-hidden">
                    {/* Decorative Top Line - Warm gradient */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />

                    <div className="text-center mb-8">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate('/')}
                            className="absolute top-8 left-8 p-1 rounded-full text-ink-light hover:bg-black/5 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </motion.button>

                        <div className="inline-flex items-center justify-center p-3 rounded-full bg-paper mb-4 border border-sand">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-ink mb-2">
                            새로운 시작을 기록하세요
                        </h2>
                        <p className="text-sm text-ink-light font-serif">
                            AI 산모 일기와 함께하는 특별한 여정
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <FormInput
                            id="username"
                            label="아이디"
                            type="text"
                            placeholder="영문자와 숫자만 (3자 이상)"
                            value={form.username}
                            onChange={updateField('username')}
                            error={errors.username}
                            disabled={isLoading}
                        />

                        <FormInput
                            id="password"
                            label="비밀번호"
                            type="password"
                            placeholder="8자 이상 (특수문자 포함)"
                            value={form.password}
                            onChange={updateField('password')}
                            error={errors.password}
                            disabled={isLoading}
                            showPasswordToggle
                        />

                        <FormInput
                            id="confirmPassword"
                            label="비밀번호 확인"
                            type="password"
                            placeholder="비밀번호를 다시 입력해주세요"
                            value={form.confirmPassword}
                            onChange={updateField('confirmPassword')}
                            error={errors.confirmPassword}
                            disabled={isLoading}
                            showPasswordToggle
                        />

                        <FormInput
                            id="email"
                            label="이메일"
                            type="email"
                            placeholder="example@email.com"
                            value={form.email}
                            onChange={updateField('email')}
                            error={errors.email}
                            disabled={isLoading}
                        />

                        <FormInput
                            id="phone"
                            label="전화번호"
                            type="tel"
                            placeholder="01012345678"
                            value={form.phone}
                            onChange={updateField('phone')}
                            error={errors.phone}
                            disabled={isLoading}
                        />

                        <div className="pt-4 space-y-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={!isValid || isLoading}
                                className="w-full flex justify-center py-3.5 px-4 text-[15px] font-medium rounded-xl text-white bg-primary hover:bg-primary-dark transition-all duration-300 shadow-soft disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        가입 처리 중...
                                    </span>
                                ) : (
                                    '회원가입 완료하기'
                                )}
                            </motion.button>

                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                disabled={isLoading}
                                className="w-full flex justify-center py-3.5 px-4 text-[15px] font-medium rounded-xl text-ink-light hover:text-primary hover:bg-primary/5 transition-all duration-300"
                            >
                                이미 계정이 있으신가요? 로그인
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
