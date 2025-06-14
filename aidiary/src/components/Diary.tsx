import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  TextField,
  Typography,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Button
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Mood as MoodIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { AuthState } from '../App';

interface DiaryProps {
  authState: AuthState;
}

type Emotion =
    | 'happy'
    | 'sad'
    | 'anxious'
    | 'tired'
    | 'touched'
    | 'loving'
    | 'lonely'
    | 'calm';

interface DiaryEntry {
  id: number;
  title: string;
  content: string;
  date: string;
  emotion?: Emotion;
  aiResponse?: string;
}

const Diary: React.FC<DiaryProps> = ({ authState }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState<{ [id: number]: boolean }>({});
  const [dailyPrompt, setDailyPrompt] = useState('');

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const fetchEntries = async () => {
    try {
      const res = await api.get('/diary', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const sorted = res.data.sort((a: DiaryEntry, b: DiaryEntry) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setEntries(sorted);
    } catch (err) {
      console.error('일기 불러오기 실패', err);
    }
  };

  const fetchDailyPrompt = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/daily-question');
      setDailyPrompt(res.data.question);
    } catch (err) {
      console.error('오늘의 질문 불러오기 실패', err);
      setDailyPrompt('오늘 어떤 생각이 들었나요?');
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchDailyPrompt();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim()) return;
    setIsSubmitting(true);

    try {
      await api.post('/diary', {
        title: '일기',
        content: newEntry,
        emotion: 'calm'
      });
      setNewEntry('');
      await fetchEntries();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('작성 실패', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;
    try {
      await api.put(`/diary/${editingEntry.id}`, {
        title: editingEntry.title,
        content: editingEntry.content,
        emotion: editingEntry.emotion
      });
      setEditingEntry(null);
      await fetchEntries();
    } catch (err) {
      console.error('수정 실패', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    try {
      await api.delete(`/diary/${selectedEntry.id}`);
      setShowDeleteConfirm(false);
      await fetchEntries();
    } catch (err) {
      console.error('삭제 실패', err);
    }
  };

  const getEmotionIcon = (emotion?: Emotion) => {
    const colorMap: { [key in Emotion]: string } = {
      happy: '#4caf50',
      sad: '#2196f3',
      anxious: '#ff9800',
      tired: '#9e9e9e',
      touched: '#ab47bc',
      loving: '#e91e63',
      lonely: '#3f51b5',
      calm: '#009688'
    };
    return <MoodIcon sx={{ color: colorMap[emotion || 'calm'] }} />;
  };

  const getAIAnalysis = async (
      content: string
  ): Promise<{ emotion: Emotion; response: string }> => {
    try {
      const res = await axios.post('http://localhost:5001/api/openai', {
        prompt: content
      });
      return {
        emotion: res.data.emotion || 'calm',
        response: res.data.response || '응원할게요!'
      };
    } catch (err) {
      console.error('AI 응답 실패:', err);
      return {
        emotion: 'calm',
        response: '응답 생성 실패'
      };
    }
  };

  const mainColor = '#fff0e6';
  const subColor = '#c2675a';

  return (
      <Box sx={{ p: 3, backgroundColor: mainColor, minHeight: '100vh' }}>
        <Typography variant="h4" sx={{ textAlign: 'center', mb: 4, color: subColor, fontWeight: 'bold' }}>
          우리 아이의 성장일기
        </Typography>

        <Grid item xs={12}>
          {dailyPrompt && (
              <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    backgroundColor: '#fffaf0',
                    borderLeft: `6px solid ${subColor}`,
                    cursor: 'pointer'
                  }}
                  onClick={() => setNewEntry((prev) => `${dailyPrompt}\n${prev}`)}
              >
                <Typography variant="subtitle1" sx={{ color: subColor }}>
                  ✨ 오늘의 질문: {dailyPrompt}
                </Typography>
                <Typography variant="caption" sx={{ color: '#888' }}>
                  (눌러서 일기에 추가할 수 있어요)
                </Typography>
              </Paper>
          )}
        </Grid>

        <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2, backgroundColor: '#ffffff' }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="당신의 생각을 들려주세요"
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, borderColor: subColor } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    endIcon={<SendIcon />}
                    disabled={isSubmitting || !newEntry.trim()}
                    fullWidth
                    sx={{ py: 1.5, borderRadius: 2, backgroundColor: subColor }}
                >
                  기록하기
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>

        <Box sx={{ display: 'grid', gap: 3 }}>
          {entries.map((entry) => (
              <Card key={entry.id} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon sx={{ color: '#7f8c8d' }} />
                      <Typography color="textSecondary">{entry.date}</Typography>
                    </Box>
                    <Box>
                      <IconButton onClick={() => setEditingEntry(entry)}><EditIcon sx={{ color: subColor }} /></IconButton>
                      <IconButton color="error" onClick={() => { setSelectedEntry(entry); setShowDeleteConfirm(true); }}>
                        <DeleteIcon sx={{ color: subColor }} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body1" paragraph sx={{ mb: 3 }}>{entry.content}</Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip icon={getEmotionIcon(entry.emotion)} label={entry.emotion} sx={{ backgroundColor: subColor, color: '#fff' }} />
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={async () => {
                          setLoadingResponses((prev) => ({ ...prev, [entry.id]: true }));
                          const { emotion, response } = await getAIAnalysis(entry.content);
                          setEntries((prev) =>
                              prev.map((e) =>
                                  e.id === entry.id ? { ...e, aiResponse: response, emotion } : e
                              )
                          );
                          setLoadingResponses((prev) => ({ ...prev, [entry.id]: false }));
                        }}
                    >
                      {loadingResponses[entry.id] ? '불러오는 중...' : '태아의 반응 보기'}
                    </Button>

                    {entry.aiResponse && (
                        <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: '#6d4c41' }}>
                          👶 {entry.aiResponse}
                        </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
          ))}
        </Box>

        <Dialog open={!!editingEntry} onClose={() => setEditingEntry(null)} maxWidth="md" fullWidth>
          <DialogTitle>일기 수정</DialogTitle>
          <DialogContent>
            <TextField
                fullWidth
                multiline
                rows={4}
                value={editingEntry?.content || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry!, content: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingEntry(null)}>취소</Button>
            <Button onClick={handleUpdate} variant="contained" color="primary">저장</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
          <DialogTitle>삭제 확인</DialogTitle>
          <DialogContent>정말로 이 일기를 삭제하시겠습니까?</DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteConfirm(false)}>취소</Button>
            <Button onClick={handleDelete} variant="contained" color="error">삭제</Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default Diary;
