import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

interface LoginProps {
    onLogin: (username: string, password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

    const mainColor = '#fff0e6';
    const subColor = '#c2675a';

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
             style={{ backgroundColor: mainColor }}>
            <div className="max-w-md w-full space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-64 h-64 rounded-full blur-2xl opacity-25"
                             style={{ backgroundColor: subColor }}></div>
                    </div>
                    <div className="relative">
                        <h2 className="mt-6 text-center text-4xl font-extrabold tracking-tight"
                            style={{ color: subColor }}>
                            Mom's Diary
                        </h2>
                        <p className="mt-2 text-center text-lg"
                           style={{ color: subColor }}>
                            소중한 순간을 기록하세요
                        </p>
                    </div>
                </div>

                <div className="backdrop-blur-sm bg-white/40 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                     style={{ borderColor: subColor, borderWidth: '1px' }}>
                    <form className="mt-2 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium mb-1"
                                       style={{ color: subColor }}>
                                    아이디
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="appearance-none relative block w-full px-4 py-3 rounded-2xl bg-white/50 backdrop-blur-sm transition-all duration-300"
                                    style={{
                                        borderColor: subColor,
                                        borderWidth: '1px',
                                        color: subColor
                                    }}
                                    placeholder="아이디를 입력해주세요"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium mb-1"
                                       style={{ color: subColor }}>
                                    비밀번호
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none relative block w-full px-4 py-3 rounded-2xl bg-white/50 backdrop-blur-sm transition-all duration-300"
                                    style={{
                                        borderColor: subColor,
                                        borderWidth: '1px',
                                        color: subColor
                                    }}
                                    placeholder="비밀번호를 입력해주세요"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="submit"
                                className="primary-button group relative w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-2xl text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                                style={{ backgroundColor: subColor }}
                            >
                                로그인하기
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/register')}
                                className="secondary-button w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-2xl transition-all duration-300"
                                style={{
                                    backgroundColor: 'rgba(194, 103, 90, 0.1)',
                                    color: subColor
                                }}
                            >
                                새로운 마음 만들기
                            </button>
                        </div>
                    </form>
                </div>

                <div className="flex justify-center space-x-4 text-sm">
          <span
              className="cursor-pointer transition-colors duration-300 flex items-center"
              style={{ color: subColor }}
          >
            비밀번호 찾기
          </span>
                    <span style={{ color: subColor }}>•</span>
                    <span
                        className="cursor-pointer transition-colors duration-300 flex items-center"
                        style={{ color: subColor }}
                    >
            도움말
          </span>
                </div>

                <div className="text-center text-xs mt-4" style={{ color: subColor }}>
                    <p>함께하는 임신과 출산의 여정</p>
                    <p>당신의 모든 순간을 소중히 기록합니다</p>
                </div>
            </div>
        </div>
    );
};

export default Login;