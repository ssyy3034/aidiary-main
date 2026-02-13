import React from 'react';
import { THEME_COLORS } from '../common/FormInput';

interface CharacterDisplayProps {
    childName: string;
    childBirthday: string;
    imageUrl: string;
}

/**
 * 캐릭터 표시 컴포넌트
 */
const CharacterDisplay: React.FC<CharacterDisplayProps> = ({
    childName,
    childBirthday,
    imageUrl,
}) => {
    const { sub: subColor } = THEME_COLORS;

    const formattedDate = new Date(childBirthday).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="mb-6 animate-fade-in">
            {/* 아이 정보 헤더 */}
            <div
                className="text-center p-5 rounded-3xl mb-4"
                style={{
                    background: 'linear-gradient(145deg, rgba(255,240,230,0.4) 0%, rgba(255,255,255,0.7) 100%)',
                    boxShadow: '0 8px 32px rgba(194, 103, 90, 0.1)',
                    border: '1px solid rgba(194, 103, 90, 0.1)',
                }}
            >
                <div
                    className="p-4 rounded-2xl mb-3"
                    style={{
                        background: 'linear-gradient(135deg, rgba(194, 103, 90, 0.1) 0%, rgba(255, 255, 255, 0.3) 100%)',
                    }}
                >
                    <h2
                        className="text-3xl font-bold mb-1"
                        style={{
                            color: subColor,
                            textShadow: '2px 2px 4px rgba(194, 103, 90, 0.15)',
                        }}
                    >
                        {childName}
                    </h2>
                    <p className="text-gray-500 italic text-sm">
                        우리 가족의 새로운 행복
                    </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <p className="text-gray-600 text-sm">우리 아이를 만나는 날</p>
                    <span
                        className="px-5 py-2 rounded-2xl text-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                        style={{
                            backgroundColor: `${subColor}15`,
                            color: subColor,
                        }}
                    >
                        {formattedDate}
                    </span>
                </div>
            </div>

            {/* 캐릭터 이미지 */}
            <div className="relative text-center">
                <div
                    className="absolute -inset-3 rounded-[40px] -z-10"
                    style={{ background: 'rgba(255, 240, 230, 0.3)' }}
                />
                <img
                    src={imageUrl}
                    alt="우리 아이 캐릭터"
                    className="w-full max-w-[300px] mx-auto rounded-3xl shadow-lg transition-transform duration-300 cursor-pointer hover:scale-[1.02]"
                    style={{ boxShadow: '0 8px 30px rgba(194, 103, 90, 0.2)' }}
                />
            </div>
        </div>
    );
};

export default CharacterDisplay;
