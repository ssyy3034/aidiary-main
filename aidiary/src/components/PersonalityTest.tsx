import React, { useState } from 'react';
import {
    Box,
    Typography,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
    Button
} from '@mui/material';

interface PersonalityTestProps {
    parentLabel: string;
    onSubmit: (summary: string) => void;
}

const questions = [
    {
        question: '새로운 사람들과 어울리는 것이...',
        options: [
            '아주 즐겁고 활력을 준다',
            '꽤 즐겁지만 때로는 피곤하다',
            '가끔은 좋지만 혼자가 편하다',
            '대부분 부담스럽고 피하고 싶다'
        ]
    },
    {
        question: '감정을 표현하는 것은...',
        options: [
            '자연스럽고 자주 표현한다',
            '기분 좋을 때는 표현한다',
            '가끔 표현하지만 조심스럽다',
            '거의 하지 않고 속으로 삼킨다'
        ]
    },
    {
        question: '문제를 해결할 때 나는...',
        options: [
            '즉흥적으로 행동하며 유연하게 대처한다',
            '큰 그림을 먼저 그리고 계획을 세운다',
            '천천히 생각하고 분석하며 접근한다',
            '다른 사람의 조언을 먼저 듣는다'
        ]
    },
    {
        question: '스트레스를 받을 때 나는...',
        options: [
            '주변 사람에게 털어놓으며 풀려고 한다',
            '혼자만의 시간을 가지려 한다',
            '바쁘게 움직이며 잊으려 한다',
            '잠시 쉬거나 아무것도 하지 않는다'
        ]
    },
    {
        question: '아이에게 바라는 성격은...',
        options: [
            '활발하고 밝은 성격',
            '차분하고 사려 깊은 성격',
            '호기심 많고 창의적인 성격',
            '다정하고 공감하는 성격'
        ]
    }
];

const mainColor = '#fff0e6';
const subColor = '#c2675a';

const PersonalityTest: React.FC<PersonalityTestProps> = ({ parentLabel, onSubmit }) => {
    const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''));

    const handleChange = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    const handleSubmit = () => {
        const summary = questions.map((q, i) => `Q${i + 1}: ${q.question}\nA: ${answers[i]}`).join('\n\n');
        onSubmit(`${parentLabel}의 성격 테스트 결과:\n${summary}`);
    };

    const isComplete = answers.every((a) => a !== '');

    return (
        <Box
            sx={{
                backgroundColor: mainColor,
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 6,
                px: 2
            }}
        >
            <Box
                sx={{
                    maxWidth: 600,
                    width: '100%',
                    backdropFilter: 'blur(12px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    border: `1px solid ${subColor}`,
                    borderRadius: 4,
                    p: 4,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                }}
            >
                <Typography variant="h5" align="center" fontWeight="bold" gutterBottom sx={{ color: subColor }}>
                    {parentLabel}의 성격 테스트
                </Typography>
                <Typography variant="subtitle1" align="center" sx={{ color: subColor, mb: 3 }}>
                    마음을 알아가는 시간이에요
                </Typography>

                {questions.map((q, index) => (
                    <Box key={index} sx={{ mb: 3 }}>
                        <Typography sx={{ color: subColor, fontWeight: 600, mb: 1 }}>{q.question}</Typography>
                        <FormControl component="fieldset">
                            <RadioGroup
                                value={answers[index]}
                                onChange={(e) => handleChange(index, e.target.value)}
                            >
                                {q.options.map((opt, i) => (
                                    <FormControlLabel
                                        key={i}
                                        value={opt}
                                        control={
                                            <Radio
                                                sx={{
                                                    color: subColor,
                                                    '&.Mui-checked': { color: subColor }
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ color: '#4a403a' }}>{opt}</Typography>
                                        }
                                    />
                                ))}
                            </RadioGroup>
                        </FormControl>
                    </Box>
                ))}

                <Button
                    fullWidth
                    disabled={!isComplete}
                    onClick={handleSubmit}
                    sx={{
                        mt: 2,
                        py: 1.5,
                        fontWeight: 'bold',
                        borderRadius: '16px',
                        backgroundColor: subColor,
                        color: 'white',
                        '&:hover': {
                            backgroundColor: '#b7554d'
                        }
                    }}
                >
                    성격 결과 제출
                </Button>
            </Box>
        </Box>
    );
};

export default PersonalityTest;
