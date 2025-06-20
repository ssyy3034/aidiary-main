import React, { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Divider,
    Paper,
    CircularProgress
} from '@mui/material';
import PersonalityTest from './PersonalityTest';
import axios from 'axios';
import { usePersonality } from './PersonalityContext';
import { useNavigate } from 'react-router-dom';

interface CharacterPersonalityBuilderProps {
    onPersonalityGenerated: (summary: string) => void;
}

const mainColor = '#fff0e6';
const subColor = '#c2675a';

// 마크다운 블록 내부 추출
const extractMarkdownContent = (text: string): string => {
    const match = text.match(/```markdown([\s\S]*?)```/i);
    return match ? match[1].trim() : text;
};

// 마크다운 섹션별 필드 추출
const getField = (field: string, markdown: string): string => {
    const emojiMap: Record<string, string> = {
        '유전적 성격 경향': '🧬',
        '성격 키워드': '✨',
        '간단한 성격 설명': '🧠'
    };
    const emoji = emojiMap[field] ?? '';
    const pattern = `##\\s*${emoji}\\s*${field}\\s*[\\n\\r]+([\\s\\S]*?)(?=\\n##|$)`;
    const regex = new RegExp(pattern, 'i');
    const match = markdown.match(regex);
    return match ? match[1].trim() : '';
};

const CharacterPersonalityBuilder: React.FC<CharacterPersonalityBuilderProps> = ({ onPersonalityGenerated }) => {
    const [parent1Result, setParent1Result] = useState<string | null>(null);
    const [parent2Result, setParent2Result] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [generatedPersonality, setGeneratedPersonality] = useState<string>('');
    const { setPersonality } = usePersonality();
    const navigate = useNavigate(); // ✅ 컴포넌트 안에서 선언

    const handleGenerate = async () => {
        if (!parent1Result || !parent2Result) return;

        setLoading(true);
        try {
            const prompt = `다음은 부모 두 사람의 성격 테스트 결과입니다.\n\n부모1:\n${parent1Result}\n\n부모2:\n${parent2Result}\n\n당신은 유전심리학 기반의 성격 분석 전문가입니다. 부모의 성격적 특성과 조합을 바탕으로 가상의 아이 성격을 아래 형식에 맞춰 분석해주세요.\n\n응답은 반드시 아래 마크다운 문법을 따르세요:\n\n\`\`\`markdown\n## 🧬 유전적 성격 경향\n- ...\n## ✨ 성격 키워드\n- 키워드1\n- 키워드2\n- 키워드3\n## 🧠 간단한 성격 설명\n...\n\`\`\``;

            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: '당신은 성격 분석 및 조합을 전문으로 하는 AI입니다.' },
                        { role: 'user', content: prompt }
                    ]
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const resultText = response.data.choices[0].message.content;
            setGeneratedPersonality(resultText);
            setPersonality(resultText); // 전역 상태 저장
            onPersonalityGenerated(resultText);

            // ✅ 생성 완료 후 캐릭터 생성 페이지로 이동
            navigate('/character');
        } catch (error) {
            console.error('GPT 요청 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const markdownBody = extractMarkdownContent(generatedPersonality);

    return (
        <Box sx={{ backgroundColor: mainColor, minHeight: '100vh', py: 6, px: 2, display: 'flex', justifyContent: 'center' }}>
            <Paper elevation={3} sx={{ maxWidth: 800, width: '100%', p: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: `1px solid ${subColor}`, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
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
                    <Button
                        variant="contained"
                        disabled={!parent1Result || !parent2Result || loading}
                        onClick={handleGenerate}
                        sx={{
                            borderRadius: '16px',
                            px: 4,
                            py: 1.5,
                            backgroundColor: subColor,
                            color: 'white',
                            fontWeight: 'bold',
                            '&:hover': { backgroundColor: '#b7554d' }
                        }}
                    >
                        {loading ? (
                            <>
                                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                                분석 중...
                            </>
                        ) : (
                            '아이 성격 생성하기'
                        )}
                    </Button>
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
            </Paper>
        </Box>
    );
};

export default CharacterPersonalityBuilder;
