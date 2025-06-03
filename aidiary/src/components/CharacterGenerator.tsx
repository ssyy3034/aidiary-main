import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';

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
    existingCharacter: string | null;
}

const CharacterGenerator: React.FC<CharacterGeneratorProps> = ({ onCharacterCreated, existingCharacter }) => {
    const [result, setResult] = useState<any>(null);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(existingCharacter || null);
    const [childName, setChildName] = useState('');
    const [childBirthday, setChildBirthday] = useState('');
    const [parent1File, setParent1File] = useState<File | null>(null);
    const [parent2File, setParent2File] = useState<File | null>(null);

    const mainColor = '#fff0e6';
    const subColor = '#c2675a';

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    useEffect(() => {
        if (existingCharacter) {
            setGeneratedImage(existingCharacter);
        }
    }, [existingCharacter]);

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
            const response = await axios.post('http://localhost:5001/analyze', formData, {
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

    return (
        <Box sx={{
            width: '100%',
            maxWidth: '600px',
            mx: 'auto',
            mt: 4,
            px: 2
        }}>
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
                <Typography
                    variant="h5"
                    align="center"
                    sx={{
                        color: subColor,
                        fontWeight: 700,
                        mb: 4
                    }}
                >
                    {existingCharacter ? '생성된 AI 캐릭터' : '우리 아이 AI 캐릭터 만들기'}
                </Typography>

                {!existingCharacter && (
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ mb: 3 }}>
                            <TextField
                                fullWidth
                                label="아이의 이름"
                                value={childName}
                                onChange={(e) => setChildName(e.target.value)}
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
                                onChange={(e) => setChildBirthday(e.target.value)}
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

                            <Button
                                type="submit"
                                fullWidth
                                disabled={loading}
                                sx={{
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
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} sx={{ color: 'white' }} />
                                ) : '캐릭터 생성하기'}
                            </Button>
                        </Box>
                    </form>
                )}

                {status && (
                    <Typography
                        align="center"
                        sx={{
                            mt: 2,
                            color: loading ? subColor : status.includes('실패') ? 'error.main' : 'success.main'
                        }}
                    >
                        {status}
                    </Typography>
                )}

                {generatedImage && (
                    <Box sx={{ mt: 4 }}>
                        {!existingCharacter && (
                            <Typography
                                variant="h6"
                                align="center"
                                sx={{
                                    color: subColor,
                                    fontWeight: 600,
                                    mb: 2
                                }}
                            >
                                생성된 AI 캐릭터
                            </Typography>
                        )}
                        <Box
                            sx={{
                                maxWidth: '500px',
                                margin: '0 auto',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                boxShadow: '0 8px 30px rgb(0,0,0,0.12)',
                                border: `1px solid ${subColor}`
                            }}
                        >
                            <img
                                src={generatedImage}
                                alt="Generated Character"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block'
                                }}
                            />
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default CharacterGenerator;