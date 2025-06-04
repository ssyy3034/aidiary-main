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
  MoodBad as MoodBadIcon,
  SentimentNeutral as NeutralIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { AuthState } from '../App';

interface DiaryProps {
  authState: AuthState;
}

interface DiaryEntry {
  id: number;
  title: string;
  content: string;
  date: string;
  emotion?: 'positive' | 'negative' | 'neutral';
}

const Diary: React.FC<DiaryProps> = ({ authState }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const fetchEntries = async () => {
    try {
      const res = await api.get('/diary');
      setEntries(res.data);
    } catch (err) {
      console.error('일기 불러오기 실패', err);
    }
  };

  useEffect(() => {
    console.log('authState 내부 정보:', authState);
    console.log('authState.userInfo:', authState.userInfo);
    console.log('authState.userInfo.id:', authState.userInfo?.id);
  }, [authState]);
  if (!authState?.userInfo?.id) {
    return <Typography>로그인 정보를 불러오는 중입니다...</Typography>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim()) return;
    setIsSubmitting(true);
    console.log('요청 내용:', {
      content: newEntry,
      userId: authState.userInfo?.id,
    });


    try {
      const userId = authState?.userInfo?.id;
      if (!userId) throw new Error('로그인 정보가 없습니다.');

      await api.post('/diary', {
        title: '일기',
        content: newEntry,
        emotion: 'neutral',
        userId: userId
      });

      setNewEntry('');
      fetchEntries();
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
      fetchEntries();
    } catch (err) {
      console.error('수정 실패', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    try {
      await api.delete(`/diary/${selectedEntry.id}`);
      setShowDeleteConfirm(false);
      fetchEntries();
    } catch (err) {
      console.error('삭제 실패', err);
    }
  };

  const getEmotionIcon = (emotion?: 'positive' | 'negative' | 'neutral') => {
    switch (emotion) {
      case 'positive': return <MoodIcon sx={{ color: '#4caf50' }} />;
      case 'negative': return <MoodBadIcon sx={{ color: '#f44336' }} />;
      default: return <NeutralIcon sx={{ color: '#757575' }} />;
    }
  };

  return (
      <Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
        <Typography variant="h4" sx={{ textAlign: 'center', mb: 4, color: '#2c3e50', fontWeight: 'bold' }}>
          우리 아이의 성장일기
        </Typography>

        <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2, backgroundColor: '#ffffff' }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="오늘 우리 아이는 어떤 하루를 보냈나요?"
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    endIcon={<SendIcon />}
                    disabled={isSubmitting}
                    fullWidth
                    sx={{ py: 1.5, borderRadius: 2 }}
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
                      <IconButton onClick={() => setEditingEntry(entry)}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => { setSelectedEntry(entry); setShowDeleteConfirm(true); }}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body1" paragraph sx={{ mb: 3 }}>{entry.content}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip icon={getEmotionIcon(entry.emotion)} label={entry.emotion} />
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
