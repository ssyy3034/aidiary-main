import React, { useState } from 'react';
import { THEME_COLORS } from '../common/FormInput';
import type { ChatMessage } from '../../types';

interface CharacterChatProps {
    messages: ChatMessage[];
    onSendMessage: (content: string) => Promise<void>;
}

/**
 * AI 채팅 컴포넌트
 */
const CharacterChat: React.FC<CharacterChatProps> = ({ messages, onSendMessage }) => {
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { main: mainColor, sub: subColor } = THEME_COLORS;

    const handleSend = async () => {
        if (!input.trim() || isSending) return;

        setIsSending(true);
        const message = input;
        setInput('');

        try {
            await onSendMessage(message);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="mt-4">
            {/* 메시지 목록 */}
            <div
                className="max-h-[300px] overflow-y-auto mb-3 p-4 rounded-3xl min-h-[150px] flex flex-col gap-3"
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)',
                }}
            >
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 my-auto">
                        <p>👶 아이에게 말을 걸어보세요!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`max-w-[70%] px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                msg.sender === 'user'
                                    ? 'self-end rounded-[20px_20px_0_20px]'
                                    : 'self-start rounded-[20px_20px_20px_0]'
                            }`}
                            style={{
                                backgroundColor: msg.sender === 'user' ? subColor : mainColor,
                                color: msg.sender === 'user' ? '#fff' : '#333',
                                boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                            }}
                        >
                            {msg.content}
                        </div>
                    ))
                )}
            </div>

            {/* 입력 필드 */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isSending}
                    placeholder="아이에게 하고 싶은 말을 입력하세요..."
                    className="flex-1 px-4 py-3 rounded-2xl bg-white/80 transition-all duration-300 focus:outline-none focus:ring-2 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
                    style={{
                        borderColor: subColor,
                        borderWidth: '1px',
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={isSending || !input.trim()}
                    className="px-6 py-3 rounded-2xl text-white font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                    style={{ backgroundColor: subColor }}
                >
                    {isSending ? '...' : '전송'}
                </button>
            </div>
        </div>
    );
};

export default CharacterChat;
