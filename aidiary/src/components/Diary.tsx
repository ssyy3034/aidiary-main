import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Card, 
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Mood as MoodIcon,
  MoodBad as MoodBadIcon,
  SentimentNeutral as NeutralIcon
} from '@mui/icons-material';
import CharacterGenerator from './CharacterGenerator';

interface DiaryEntry {
  id: number;
  content: string;
  date: string;
  aiResponse?: string;
  emotion?: 'positive' | 'negative' | 'neutral';
}

const Diary: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEntry.trim()) {
      const entry: DiaryEntry = {
        id: Date.now(),
        content: newEntry,
        date: new Date().toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        aiResponse: '아이의 발달이 정상적으로 진행되고 있습니다. 계속해서 관찰해주세요.',
        emotion: Math.random() > 0.5 ? 'positive' : 'neutral'
      };
      setEntries([entry, ...entries]);
      setNewEntry('');
    }
  };

  const handleEdit = (entry: DiaryEntry) => {
    setEditingEntry(entry);
  };

  const handleSaveEdit = () => {
    if (editingEntry) {
      setEntries(entries.map(e => 
        e.id === editingEntry.id ? editingEntry : e
      ));
      setEditingEntry(null);
    }
  };

  const handleDelete = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedEntry) {
      setEntries(entries.filter(e => e.id !== selectedEntry.id));
      setShowDeleteConfirm(false);
      setSelectedEntry(null);
    }
  };

  const getEmotionIcon = (emotion?: 'positive' | 'negative' | 'neutral') => {
    switch (emotion) {
      case 'positive':
        return <MoodIcon color="success" />;
      case 'negative':
        return <MoodBadIcon color="error" />;
      default:
        return <NeutralIcon color="action" />;
    }
  };

  return (
    <div>
      <CharacterGenerator />
      <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          AI 육아 다이어리
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="오늘의 아이 모습을 기록해주세요..."
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              endIcon={<SendIcon />}
              sx={{ float: 'right' }}
            >
              등록하기
            </Button>
          </form>
        </Paper>

        <Box sx={{ display: 'grid', gap: 3 }}>
          {entries.map((entry) => (
            <Box key={entry.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography color="textSecondary">
                      {entry.date}
                    </Typography>
                    <Box>
                      <IconButton onClick={() => handleEdit(entry)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(entry)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body1" paragraph>
                    {entry.content}
                  </Typography>
                  {entry.aiResponse && (
                    <Paper sx={{ p: 2, backgroundColor: '#f0f7ff' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getEmotionIcon(entry.emotion)}
                        <Typography variant="body2" color="primary">
                          AI 분석: {entry.aiResponse}
                        </Typography>
                      </Box>
                    </Paper>
                  )}
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        <Dialog open={!!editingEntry} onClose={() => setEditingEntry(null)} maxWidth="md" fullWidth>
          <DialogTitle>일기 수정</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={8}
              value={editingEntry?.content || ''}
              onChange={(e) => editingEntry && setEditingEntry({
                ...editingEntry,
                content: e.target.value
              })}
              margin="normal"
              sx={{ minWidth: '500px' }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingEntry(null)}>취소</Button>
            <Button onClick={handleSaveEdit} variant="contained">저장</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
          <DialogTitle>삭제 확인</DialogTitle>
          <DialogContent>
            <Typography>정말로 이 일기를 삭제하시겠습니까?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteConfirm(false)}>취소</Button>
            <Button onClick={confirmDelete} color="error">삭제</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </div>
  );
};

export default Diary; 