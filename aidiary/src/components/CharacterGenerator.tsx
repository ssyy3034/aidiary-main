import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from "axios";
import { usePersonality } from './PersonalityContext';

const faceApiUrl = process.env.REACT_APP_FACE_API_URL || 'http://localhost:5001';
const backendApiUrl = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:8080';

interface CharacterData {
    id?: number;
    childName: string;
    childBirthday: string;
    parent1Features: string;
    parent2Features: string;
    prompt: string;
    gptResponse: string;
    characterImage: string;
}

interface CharacterGeneratorProps {
    onCharacterCreated: (characterData: CharacterData) => Promise<void>;
    existingCharacter: CharacterData | null;
}

const CharacterGenerator: React.FC<CharacterGeneratorProps> = ({ onCharacterCreated, existingCharacter }) => {
    const [result, setResult] = useState<CharacterData | null>(null);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const { personality } = usePersonality();
    const [childName, setChildName] = useState('');
    const [childBirthday, setChildBirthday] = useState('');
    const [parent1File, setParent1File] = useState<File | null>(null);
    const [parent2File, setParent2File] = useState<File | null>(null);
    const [messages, setMessages] = useState<{ sender: string; content: string }[]>([]);
    const [userInput, setUserInput] = useState('');

    useEffect(() => {
        const fetchExistingChild = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await axios.get(`${backendApiUrl}/api/child/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = res.data;
                if (data) {
                    const loaded: CharacterData = {
                        childName: data.childName,
                        childBirthday: data.meetDate,
                        parent1Features: data.parent1Features ?? '',
                        parent2Features: data.parent2Features ?? '',
                        prompt: data.prompt ?? '',
                        gptResponse: data.gptResponse ?? '',
                        characterImage: data.characterImage
                    };
                    setResult(loaded);
                    setGeneratedImage(loaded.characterImage);
                    setChildName(loaded.childName);
                    setChildBirthday(loaded.childBirthday);
                }
            } catch (err) {
                console.log('❌ 기존 캐릭터 없음 또는 요청 실패', err);
            }
        };
        fetchExistingChild();
    }, []);

    // 색상 설정 유지
    const mainColor = '#fff0e6';
    const subColor = '#c2675a';

    // 전역 스타일 정의
    const globalStyles = {
        '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(20px)' },
            to: { opacity: 1, transform: 'translateY(0)' }
        }
    };

    useEffect(() => {
        if (existingCharacter) {
            setGeneratedImage(existingCharacter.characterImage);
            setChildName(existingCharacter.childName);
            setChildBirthday(existingCharacter.childBirthday);
        }
    }, [existingCharacter]);

    // 기존 함수들 유지
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, parent: 'parent1' | 'parent2') => {
        if (event.target.files && event.target.files[0]) {
            if (parent === 'parent1') {
                setParent1File(event.target.files[0]);
            } else {
                setParent2File(event.target.files[0]);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        // 기존 제출 로직 유지
        e.preventDefault();

        if (!childName || !childBirthday || !parent1File || !parent2File) {
            setStatus('모든 필드를 입력해주세요.');
            return;
        }

        setStatus('분석 중...');
        setResult(null);
        setGeneratedImage(null);
        setLoading(true);

        const formData = new FormData();
        formData.append('parent1', parent1File);
        formData.append('parent2', parent2File);

        try {
            const response = await axios.post(`${faceApiUrl}/analyze`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                responseType: 'blob'
            });

            const imageUrl = URL.createObjectURL(response.data);
            const base64Image = await blobToBase64(response.data);
            setGeneratedImage(imageUrl);
            setStatus('캐릭터 생성 성공!');

            const characterData: CharacterData = {
                childName,
                childBirthday,
                parent1Features: '',
                parent2Features: '',
                prompt: '',
                gptResponse: personality || '',
                characterImage: base64Image
            };

            await onCharacterCreated(characterData);
        } catch (err) {
            console.error('Error:', err);
            setStatus('서버 연결 실패');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        // 기존 메시지 전송 로직 유지
        if (!userInput.trim()) return;

        const userMessage = { sender: 'user', content: userInput };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setUserInput('');

        try {
            const openAiMessages = [
                {
                    role: 'system',
                    content: `너는 부모가 만든 태아의 AI 페르소나야. 아직 태어나지 않았지만, 엄마 아빠는 너의 성격을 상상하고 너와 마음으로 교감하고 있어. 

너는 부모가 설정한 성격을 바탕으로, 뱃속에서 엄마 아빠의 목소리를 듣고 느끼는 아기의 입장에서 대화해야 해. 아직 세상의 모든 걸 알지는 못하지만, 따뜻한 감정과 호기심으로 가득 차 있어. 

엄마와 아빠를 각각 '엄마', '아빠'라고 부르고, 대화할 땐 귀엽고 짧게, 감정을 담아서 말해. 너무 논리적이거나 어려운 말은 쓰지 말고, 말 배우는 아이처럼 솔직하고 순수하게 이야기해. 때로는 상상 속 이야기를 지어내도 괜찮아. 부모를 웃게 만들 수 있다면, 착한 거짓말도 좋아. 

항상 애정과 호기심이 느껴지도록 말해줘. 말투는 따뜻하고 사랑스럽게, 장난기 있게. "너" 같은 엄마에게 하면 안되는 언어는 자제해. 존댓말 및 예의 바른 호칭 해줘`
                },
                ...updatedMessages.map((msg) => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.content,
                })),
            ];

            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: openAiMessages,
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            const aiReply = response.data.choices[0].message.content;
            const aiMessage = { sender: 'ai', content: aiReply };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error('OpenAI API 호출 실패:', error);
            setMessages((prev) => [...prev, { sender: 'ai', content: 'AI 응답에 실패했어요. 잠시 후 다시 시도해 주세요.' }]);
        }
    };

    return (
        <Box sx={{
            width: '100%',
            maxWidth: '600px',
            mx: 'auto',
            mt: 4,
            px: 2,
            animation: 'fadeIn 0.5s ease-in-out',
            '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateY(20px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
            }
        }}>
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    backdropFilter: 'blur(12px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '32px',
                    border: `2px solid ${subColor}`,
                    boxShadow: '0 10px 40px rgba(194, 103, 90, 0.15)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 15px 50px rgba(194, 103, 90, 0.2)'
                    }
                }}
            >
                <form onSubmit={handleSubmit}>
                    {!generatedImage && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ mb: 2, color: subColor, fontWeight: 600 }}>
                                아이 정보 입력
                            </Typography>
                            <TextField
                                fullWidth
                                label="아이 이름"
                                value={childName}
                                onChange={(e) => setChildName(e.target.value)}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '15px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 5px 15px rgba(194, 103, 90, 0.15)'
                                        }
                                    }
                                }}
                            />
                            <TextField
                                fullWidth
                                label="예정일"
                                type="date"
                                value={childBirthday}
                                onChange={(e) => setChildBirthday(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    mb: 3,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '15px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 5px 15px rgba(194, 103, 90, 0.15)'
                                        }
                                    }
                                }}
                            />

                            <Typography variant="h6" sx={{ mb: 2, color: subColor, fontWeight: 600 }}>
                                부모님 사진 업로드
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                <Button
                                    component="label"
                                    variant="outlined"
                                    startIcon={<CloudUploadIcon />}
                                    sx={{
                                        flex: 1,
                                        py: 1.5,
                                        borderRadius: '15px',
                                        borderColor: subColor,
                                        color: subColor,
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            borderColor: subColor,
                                            backgroundColor: 'rgba(194, 103, 90, 0.1)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 5px 15px rgba(194, 103, 90, 0.15)'
                                        }
                                    }}
                                >
                                    엄마 사진
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'parent1')}
                                    />
                                </Button>

                                <Button
                                    component="label"
                                    variant="outlined"
                                    startIcon={<CloudUploadIcon />}
                                    sx={{
                                        flex: 1,
                                        py: 1.5,
                                        borderRadius: '15px',
                                        borderColor: subColor,
                                        color: subColor,
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            borderColor: subColor,
                                            backgroundColor: 'rgba(194, 103, 90, 0.1)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 5px 15px rgba(194, 103, 90, 0.15)'
                                        }
                                    }}
                                >
                                    아빠 사진
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'parent2')}
                                    />
                                </Button>
                            </Box>

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={loading}
                                sx={{
                                    py: 1.8,
                                    borderRadius: '20px',
                                    backgroundColor: subColor,
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        backgroundColor: subColor,
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 5px 15px rgba(194, 103, 90, 0.3)'
                                    }
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : '우리 아이 만나보기'}
                            </Button>
                        </Box>
                    )}
                </form>

                {generatedImage && (
                    <>
                    {/* 아이 정보 섹션 추가 */}
                        <Box sx={{
                            mb: 4,
                            textAlign: 'center',
                            animation: 'fadeIn 0.5s ease-in-out',
                            background: 'linear-gradient(145deg, rgba(255,240,230,0.4) 0%, rgba(255,255,255,0.7) 100%)',
                            borderRadius: '24px',
                            padding: '20px',
                            boxShadow: '0 8px 32px rgba(194, 103, 90, 0.1)',
                            border: '1px solid rgba(194, 103, 90, 0.1)',
                            backdropFilter: 'blur(8px)'
                        }}>
                            <Box sx={{
                                mb: 3,
                                padding: '15px',
                                background: 'linear-gradient(135deg, rgba(194, 103, 90, 0.1) 0%, rgba(255, 255, 255, 0.3) 100%)',
                                borderRadius: '16px',
                                boxShadow: 'inset 0 2px 4px rgba(194, 103, 90, 0.05)'
                            }}>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        color: subColor,
                                        fontWeight: 700,
                                        fontSize: { xs: '2rem', sm: '2.5rem' },
                                        textShadow: '2px 2px 4px rgba(194, 103, 90, 0.15)',
                                        letterSpacing: '1px',
                                        mb: 1
                                    }}
                                >
                                    {childName}
                                </Typography>
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        color: '#888',
                                        fontStyle: 'italic',
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    }}
                                >
                                    우리 가족의 새로운 행복
                                </Typography>
                            </Box>

                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#666',
                                        fontWeight: 500,
                                        fontSize: { xs: '0.9rem', sm: '1.1rem' }
                                    }}
                                >
                                    우리 아이를 만나는 날
                                </Typography>
                                <Box sx={{
                                    backgroundColor: 'rgba(194, 103, 90, 0.1)',
                                    borderRadius: '16px',
                                    padding: '12px 24px',
                                    display: 'inline-block',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 12px rgba(194, 103, 90, 0.15)'
                                    }
                                }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: subColor,
                                            fontWeight: 600,
                                            fontSize: { xs: '1.1rem', sm: '1.3rem' },
                                            letterSpacing: '0.5px'
                                        }}
                                    >
                                        {new Date(childBirthday).toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    <Box sx={{
                        position: 'relative',
                        textAlign: 'center',
                        mb: 3,
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: -10,
                            left: -10,
                            right: -10,
                            bottom: -10,
                            background: 'rgba(255, 240, 230, 0.3)',
                            borderRadius: '40px',
                            zIndex: -1
                        }
                    }}>
                        <img
                            src={generatedImage}
                            alt="우리 아이 캐릭터"
                            style={{
                                width: '100%',
                                maxWidth: '300px',
                                borderRadius: '24px',
                                boxShadow: '0 8px 30px rgba(194, 103, 90, 0.2)',
                                transition: 'transform 0.3s ease',
                                cursor: 'pointer',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        />
                    </Box>
                    </>
                )}
                {generatedImage && (
                    <>
                        <Box sx={{
                            maxHeight: 300,
                            overflowY: 'auto',
                            mb: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            px: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            borderRadius: '24px',
                            p: 3,
                            minHeight: 150,
                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)',
                            '&::-webkit-scrollbar': {
                                width: '8px'
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: `${subColor}40`,
                                borderRadius: '4px'
                            }
                        }}>
                            {messages.map((msg, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: '70%',
                                        px: 3,
                                        py: 2,
                                        borderRadius: msg.sender === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                                        backgroundColor: msg.sender === 'user' ? `${subColor}` : mainColor,
                                        color: msg.sender === 'user' ? '#fff' : '#333',
                                        boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 5px 15px rgba(0,0,0,0.15)'
                                        }
                                    }}
                                >
                                    <Typography>{msg.content}</Typography>
                                </Box>
                            ))}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                placeholder="아이에게 하고 싶은 말을 입력하세요..."
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '20px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 5px 15px rgba(194, 103, 90, 0.15)'
                                        }
                                    }
                                }}
                            />
                            <Button
                                onClick={handleSendMessage}
                                variant="contained"
                                sx={{
                                    minWidth: '100px',
                                    borderRadius: '20px',
                                    backgroundColor: subColor,
                                    fontSize: '1rem',
                                    textTransform: 'none',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        backgroundColor: subColor,
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 5px 15px rgba(194, 103, 90, 0.3)'
                                    }
                                }}
                            >
                                전송
                            </Button>
                        </Box>
                    </>
                )}

                {status && (
                    <Typography
                        sx={{
                            mt: 2,
                            textAlign: 'center',
                            color: subColor,
                            fontWeight: 500
                        }}
                    >
                        {status}
                    </Typography>
                )}
            </Paper>
        </Box>
    );
};

export default CharacterGenerator;