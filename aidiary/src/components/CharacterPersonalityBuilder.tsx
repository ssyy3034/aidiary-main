```
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Divider,
    CircularProgress
} from '@mui/material';
import PersonalityTest from './PersonalityTest';
import { usePersonalityGenerator } from '../hooks/usePersonalityGenerator';
import CommonButton from './common/CommonButton';
import GlassCard from './common/GlassCard';

interface CharacterPersonalityBuilderProps {
    onPersonalityGenerated: (summary: string) => void;
}

const mainColor = '#fff0e6';
const subColor = '#c2675a';

const CharacterPersonalityBuilder: React.FC<CharacterPersonalityBuilderProps> = ({ onPersonalityGenerated }) => {
    const [parent1Result, setParent1Result] = useState<string | null>(null);
    const [parent2Result, setParent2Result] = useState<string | null>(null);

    // Custom Hook 사용
    const {
        generatePersonality,
        loading,
        generatedPersonality,
        markdownBody,
        getField
    } = usePersonalityGenerator(onPersonalityGenerated);

    const handleGenerate = () => {
        if (parent1Result && parent2Result) {
            generatePersonality(parent1Result, parent2Result);
        }
    };

    return (
        <Box sx={{ backgroundColor: mainColor, minHeight: '100vh', py: 6, px: 2, display: 'flex', justifyContent: 'center' }}>
            <GlassCard subColor={subColor}>
                <Typography variant="h5" align="center" fontWeight="bold" gutterBottom sx={{ color: subColor }}>
                    부모 성격을 기반으로 아이 성격 만들기
                </Typography>

                <Typography variant="subtitle1" align="center" sx={{ color: subColor, mb: 3 }}>
                    두 사람의 마음을 담아 아이의 성격을 상상해보세요
                </Typography>

                <PersonalityTest parentLabel="부모 1" onSubmit={setParent1Result} />
                <Divider sx={{ my: 4 }} />
                <PersonalityTest parentLabel="부모 2" onSubmit={setParent2Result} />

                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <CommonButton
                        loading={loading}
                        disabled={!parent1Result || !parent2Result}
                        onClick={handleGenerate}
                        subColor={subColor}
                    >
                        아이 성격 생성하기
                    </CommonButton>
                </Box>

                {generatedPersonality && (
                    <Box sx={{ mt: 5, p: 4, backgroundColor: '#fffdf9', borderRadius: 4, border: `2px dashed ${subColor}`, boxShadow: '0 4px 16px rgba(0,0,0,0.05)', fontFamily: `'Noto Serif KR', 'Pretendard', serif` }}>
                        <Typography variant="h6" sx={{ color: subColor, fontWeight: 700, mb: 2 }}>
                            🌟 생성된 아이 성격
                        </Typography>

                        <Typography variant="subtitle1" sx={{ color: subColor, fontWeight: 600, mb: 1 }}>
                            ✨ 성격 키워드
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                            {getField('성격 키워드', markdownBody).split('\n').map((kw, i) => (
                                <Box key={i} sx={{ px: 2, py: 0.5, borderRadius: '9999px', backgroundColor: 'rgba(194, 103, 90, 0.15)', color: subColor, fontWeight: 500, fontSize: '0.9rem' }}>
                                    {kw.replace(/^-/, '').trim()}
                                </Box>
                            ))}
                        </Box>

                        <Typography variant="subtitle1" sx={{ color: subColor, fontWeight: 600, mb: 1 }}>
                            🧠 성격 설명
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#4a403a', lineHeight: 1.9, backgroundColor: 'rgba(255,255,255,0.6)', px: 2, py: 2, borderRadius: 2, whiteSpace: 'pre-line' }}>
                            {getField('간단한 성격 설명', markdownBody)}
                        </Typography>
                    </Box>
                )}
            </GlassCard>
        </Box>
    );
};


export default CharacterPersonalityBuilder;
```
