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
  DialogActions,
  Grid,
  Chip,
  Divider,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Mood as MoodIcon,
  MoodBad as MoodBadIcon,
  SentimentNeutral as NeutralIcon,
  Schedule as ScheduleIcon,
  Image as ImageIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';

interface DiaryEntry {
  id: number;
  content: string;
  date: string;
  aiResponse?: string;
  emotion?: 'positive' | 'negative' | 'neutral';
  imageUrl?: string;
  childMood?: string;
  activities?: string[];
  weather?: string;
}

const Diary: React.FC = () => {
  const [newEntry, setNewEntry] = useState('');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(event.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim()) return;

    setIsSubmitting(true);
    // API 연동 로직 추가 예정
    setIsSubmitting(false);
  };

  const getEmotionIcon = (emotion?: 'positive' | 'negative' | 'neutral') => {
    switch (emotion) {
      case 'positive':
        return <MoodIcon sx={{ color: '#4caf50' }} />;
      case 'negative':
        return <MoodBadIcon sx={{ color: '#f44336' }} />;
      default:
        return <NeutralIcon sx={{ color: '#757575' }} />;
    }
  };

  return (
      <Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
        <Typography variant="h4"
                    sx={{
                      textAlign: 'center',
                      mb: 4,
                      color: '#2c3e50',
                      fontWeight: 'bold'
                    }}>
          우리 아이의 성장일기
        </Typography>

        {/* 일기 작성 폼 */}
        <Paper elevation={3}
               sx={{
                 p: 4,
                 mb: 4,
                 borderRadius: 2,
                 backgroundColor: '#ffffff'
               }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} {...({} as any)}>
                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="오늘 우리 아이는 어떤 하루를 보냈나요?"
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                />
              </Grid>

              <Grid item xs={12} {...({} as any)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* 이미지 업로드 및 버튼들 */}
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {/* 일기 목록 */}
        <Box sx={{ display: 'grid', gap: 3 }}>
          {/* 일기 엔트리 예시 - API 연동 시 실제 데이터로 교체 */}
          <Card sx={{
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon sx={{ color: '#7f8c8d' }} />
                  <Typography color="textSecondary">
                    2025년 5월 15일
                  </Typography>
                </Box>
                <Box>
                  <IconButton>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                오늘 우리 아이가 18주차가 됐어요!
              </Typography>

              {/* AI 분석 결과 */}
              <Paper sx={{
                p: 2,
                backgroundColor: '#f8f9fa',
                borderRadius: 2,
                mb: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#3498db' }}>AI</Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                      AI 분석
                    </Typography>
                    <Typography variant="body2">
                      🎉 오늘로 아기가 18주차에 접어들었네요!
                      지금 아기는 귀여운 고구마만큼 자랐어요 🥔
                      점점 더 엄마 목소리도 잘 들리고, 팔다리도 활발히 움직이고 있을 거예요.
                      혹시 살짝 차는 느낌이 있었다면… 그게 바로 태동의 시작일 수도 있답니다!

                      엄마와 점점 더 연결되고 있는 지금,
                      매일의 감정과 순간을 아기에게 들려주듯 기록해보는 건 어떨까요? 😊
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                    icon={<MoodIcon />}
                    label="행복한 하루"
                    sx={{ backgroundColor: '#e8f5e9' }}
                />
                <Chip
                    icon={<ScheduleIcon />}
                    label="발달 이정표"
                    sx={{ backgroundColor: '#e3f2fd' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 편집 다이얼로그 */}
        <Dialog open={!!editingEntry}
                onClose={() => setEditingEntry(null)}
                maxWidth="md"
                fullWidth>
          {/* 다이얼로그 내용 */}
        </Dialog>

        {/* 삭제 확인 다이얼로그 */}
        <Dialog open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}>
          {/* 다이얼로그 내용 */}
        </Dialog>
      </Box>
  );
};

export default Diary;