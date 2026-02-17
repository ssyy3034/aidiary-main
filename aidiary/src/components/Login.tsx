import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import FormInput from './common/FormInput';

interface LoginProps {
    onLogin: (username: string, password: string) => Promise<void> | void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onLogin(username, password);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-5 bg-linen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-full max-w-sm"
            >
                {/* Brand mark */}
                <div className="text-center mb-10">
                    <div className="inline-block mb-5">
                        {/* Hand-drawn style circle */}
                        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="mx-auto">
                            <path d="M28 4C14 4 4 14 4 28s10 24 24 24 24-10 24-24S42 4 28 4z" stroke="#C67D5B" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 4" />
                            <text x="28" y="33" textAnchor="middle" fill="#C67D5B" fontSize="18" fontFamily="serif">M</text>
                        </svg>
                    </div>
                    <h1 className="font-display text-[28px] font-bold text-ink tracking-tight">
                        산모일기
                    </h1>
                    <p className="text-cocoa-muted text-[13px] mt-2 font-body">
                        소중한 순간을 기록하는 나만의 노트
                    </p>
                </div>

                {/* Login card */}
                <div className="bg-white border border-linen-deep rounded-lg shadow-paper p-7 relative">
                    {/* Top border accent - like a notebook spine */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-terra/0 via-terra/40 to-terra/0 rounded-t-lg" />

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <FormInput
                            id="username"
                            label="아이디"
                            type="text"
                            placeholder="아이디를 입력해주세요"
                            value={username}
                            onChange={setUsername}
                            disabled={isLoading}
                        />
                        <FormInput
                            id="password"
                            label="비밀번호"
                            type="password"
                            placeholder="비밀번호를 입력해주세요"
                            value={password}
                            onChange={setPassword}
                            disabled={isLoading}
                            showPasswordToggle
                        />

                        <div className="pt-3 space-y-3">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-4 text-[14px] font-bold rounded-md text-white bg-terra hover:bg-terra-dark active:bg-terra-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                            >
                                {isLoading ? '로그인 중...' : '시작하기'}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/register')}
                                disabled={isLoading}
                                className="w-full py-2.5 text-[13px] text-cocoa-muted hover:text-terra transition-colors"
                            >
                                계정이 없으신가요? <span className="font-bold underline underline-offset-2">회원가입</span>
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-[11px] text-cocoa-muted/50 mt-8 font-body tracking-wide">
                    AI 산모일기
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
