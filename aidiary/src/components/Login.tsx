import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
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
                {/* Book Cover / Invitation Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-card rounded-2xl p-8 sm:p-12 relative overflow-hidden">
                    {/* Decorative Top Line - Warm gradient */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />

                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center justify-center p-3 rounded-full bg-paper mb-6 border border-sand"
                        >
                            <Sparkles className="w-6 h-6 text-primary" />
                        </motion.div>
                        <h2 className="text-3xl font-serif font-bold text-ink mb-3 tracking-tight">
                            Mom's Diary
                        </h2>
                        <p className="text-ink-light font-serif italic">
                            "소중한 모든 순간을 기록하세요"
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
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
                        </div>

                        <div className="space-y-4 pt-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3.5 px-4 text-[15px] font-medium rounded-xl text-white bg-primary hover:bg-primary-dark transition-all duration-300 shadow-soft disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        로그인 중...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        다이어리 펼치기
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </motion.button>

                            <button
                                type="button"
                                onClick={() => navigate('/register')}
                                disabled={isLoading}
                                className="w-full flex justify-center py-3.5 px-4 text-[15px] font-medium rounded-xl text-ink-light hover:text-primary hover:bg-primary/5 transition-all duration-300"
                            >
                                아직 계정이 없으신가요? 회원가입
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-xs text-ink-light/60 mt-8 font-serif">
                     © 2024 AI 산모 일기. All memories secured.
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
