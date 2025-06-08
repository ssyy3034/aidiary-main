import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from "axios";

const faceApiUrl = process.env.REACT_APP_FACE_API_URL || 'http://localhost:5001';

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
    const [generatedImage, setGeneratedImage] = useState<string | null>(
        existingCharacter ? existingCharacter.characterImage : null
    );
    const [childName, setChildName] = useState('');
    const [childBirthday, setChildBirthday] = useState('');
    const [parent1File, setParent1File] = useState<File | null>(null);
    const [parent2File, setParent2File] = useState<File | null>(null);

    const [messages, setMessages] = useState<{ sender: string; content: string }[]>([]);
    const [userInput, setUserInput] = useState('');

    // 색상 설정
    const mainColor = '#fff0e6';
    const subColor = '#c2675a';

    useEffect(() => {
        if (existingCharacter) {
            setGeneratedImage(existingCharacter.characterImage);
        }
    }, [existingCharacter]);

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
                gptResponse: '',
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
        if (!userInput) return;

        const userMessage = { sender: 'user', content: userInput };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setUserInput('');

        try {
            // OpenAI용 메시지 변환 (처음 system 메시지 추가)
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
                        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`, // 또는 하드코딩된 키
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
        <Box sx={{ width: '100%', maxWidth: '600px', mx: 'auto', mt: 4, px: 2 }}>
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    backdropFilter: 'blur(8px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    borderRadius: '24px',
                    border: `1px solid ${subColor}`,
                    boxShadow: '0 8px 30px rgb(0,0,0,0.12)'
                }}
            >
                <Typography variant="h5" align="center" sx={{ color: subColor, fontWeight: 700, mb: 4 }}>
                    {existingCharacter ? '생성된 AI 캐릭터' : '우리 아이 AI 캐릭터 만들기'}
                </Typography>

                {!existingCharacter && (
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="아이의 이름"
                            value={childName}
                            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setChildName(e.target.value)}
                            required
                            sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                    '& fieldset': { borderColor: subColor },
                                    '&:hover fieldset': { borderColor: subColor },
                                    '&.Mui-focused fieldset': { borderColor: subColor }
                                },
                                '& .MuiInputLabel-root': {
                                    color: subColor,
                                    '&.Mui-focused': { color: subColor }
                                }
                            }}
                        />

                        <TextField
                            fullWidth
                            type="date"
                            label="아이의 생년월일"
                            value={childBirthday}
                            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setChildBirthday(e.target.value)}
                            required
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                    '& fieldset': { borderColor: subColor },
                                    '&:hover fieldset': { borderColor: subColor },
                                    '&.Mui-focused fieldset': { borderColor: subColor }
                                },
                                '& .MuiInputLabel-root': {
                                    color: subColor,
                                    '&.Mui-focused': { color: subColor }
                                }
                            }}
                        />

                        <Box sx={{ mb: 2 }}>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="parent1-upload"
                                type="file"
                                onChange={(e) => handleFileChange(e, 'parent1')}
                                required
                            />
                            <label htmlFor="parent1-upload">
                                <Button
                                    component="span"
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<CloudUploadIcon />}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: '16px',
                                        borderColor: subColor,
                                        color: subColor,
                                        '&:hover': {
                                            borderColor: subColor,
                                            backgroundColor: 'rgba(194, 103, 90, 0.1)'
                                        }
                                    }}
                                >
                                    {parent1File ? parent1File.name : '첫 번째 부모 사진 업로드'}
                                </Button>
                            </label>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="parent2-upload"
                                type="file"
                                onChange={(e) => handleFileChange(e, 'parent2')}
                                required
                            />
                            <label htmlFor="parent2-upload">
                                <Button
                                    component="span"
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<CloudUploadIcon />}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: '16px',
                                        borderColor: subColor,
                                        color: subColor,
                                        '&:hover': {
                                            borderColor: subColor,
                                            backgroundColor: 'rgba(194, 103, 90, 0.1)'
                                        }
                                    }}
                                >
                                    {parent2File ? parent2File.name : '두 번째 부모 사진 업로드'}
                                </Button>
                            </label>
                        </Box>

                        <Button type="submit" fullWidth sx={{
                            py: 1.5,
                            backgroundColor: subColor,
                            color: 'white',
                            borderRadius: '16px',
                            '&:hover': {
                                backgroundColor: '#b35a4d',
                            },
                            '&.Mui-disabled': {
                                backgroundColor: 'rgba(194, 103, 90, 0.5)',
                                color: 'white',
                            }
                        }}>
                            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : '캐릭터 생성하기'}
                        </Button>
                    </form>
                )}

                {generatedImage && !existingCharacter && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" align="center" sx={{ color: subColor, fontWeight: 600 }}>
                            우리 아이 캐릭터
                        </Typography>
                        <img src={generatedImage} alt="Generated Character" style={{ width: '100%' }} />
                    </Box>
                )}

                {/* Chat Interface */}
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" align="center" sx={{ color: subColor, fontWeight: 600 }}>
                        아이와 대화하기
                    </Typography>

                    <Box
                        sx={{
                            maxHeight: 300,
                            overflowY: 'auto',
                            mb: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            px: 1
                        }}
                    >
                        {messages.map((msg, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                                }}
                            >
                                <Box
                                    sx={{
                                        maxWidth: '70%',
                                        px: 2,
                                        py: 1,
                                        borderRadius: 2,
                                        backgroundColor: msg.sender === 'user' ? '#c2675a' : '#fff0e6',
                                        color: msg.sender === 'user' ? '#fff' : '#333',
                                        whiteSpace: 'pre-line',
                                        wordBreak: 'break-word',
                                        boxShadow: 1
                                    }}
                                >
                                    {msg.content}
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    <TextField
                        fullWidth
                        label="메시지 입력"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault(); // 줄바꿈 방지
                                handleSendMessage();
                            }
                        }}
                        multiline
                        rows={3}
                        variant="outlined"
                        sx={{
                            mb: 2,
                            borderRadius: '16px',
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '16px',
                                '& fieldset': { borderColor: subColor },
                                '&:hover fieldset': { borderColor: subColor },
                                '&.Mui-focused fieldset': { borderColor: subColor }
                            },
                            '& .MuiInputLabel-root': {
                                color: subColor,
                                '&.Mui-focused': { color: subColor }
                            }
                        }}
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={handleSendMessage}
                        sx={{
                            py: 1.5,
                            borderRadius: '16px',
                            backgroundColor: subColor,
                            '&:hover': {
                                backgroundColor: '#b35a4d',
                            },
                        }}
                    >
                        보내기
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default CharacterGenerator;
