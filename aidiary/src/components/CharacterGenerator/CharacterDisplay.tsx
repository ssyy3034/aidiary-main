import React from 'react';
import { motion } from 'framer-motion';
import { THEME_COLORS } from '../common/FormInput';
import CharacterCanvas from './CharacterCanvas';

interface CharacterDisplayProps {
    childName: string;
    childBirthday: string;
    imageUrl: string;
    imageBase64?: string;
}

/**
 * 캐릭터 표시 컴포넌트
 */
const CharacterDisplay: React.FC<CharacterDisplayProps> = ({
    childName,
    childBirthday,
    imageUrl,
    imageBase64,
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

                {/* 떠오르는 캐릭터 + 눈 애니메이션 */}
                <motion.div
                    className="inline-block max-w-[300px] w-full"
                    animate={{ y: [0, -10, 0], scale: [1, 1.015, 1] }}
                    transition={{ duration: 3.5, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' }}
                >
                    <CharacterCanvas
                        imageUrl={imageUrl}
                        imageBase64={imageBase64 ?? ''}
                        alt="우리 아이 캐릭터"
                        className="w-full rounded-3xl block"
                        style={{ boxShadow: '0 8px 30px rgba(194, 103, 90, 0.2)' }}
                    />
                </motion.div>

                {/* 바닥 그림자 — 캐릭터가 뜰수록 작아짐 */}
                <motion.div
                    className="mx-auto rounded-full"
                    style={{
                        width: '180px',
                        height: '10px',
                        background: 'rgba(194, 103, 90, 0.12)',
                        filter: 'blur(6px)',
                    }}
                    animate={{
                        scaleX: [1, 0.8, 1],
                        opacity: [0.6, 0.25, 0.6],
                    }}
                    transition={{
                        duration: 3.5,
                        ease: 'easeInOut',
                        repeat: Infinity,
                        repeatType: 'loop',
                    }}
                />
            </div>
        </div>
    );
};

export default CharacterDisplay;
