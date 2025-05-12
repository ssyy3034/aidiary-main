import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface UserProfile {
  username: string;
  email: string;
  phone: string;
  childName: string;
  childBirthday: string;
}

interface ProfileProps {
  onUpdateProfile: (profile: UserProfile) => void;
  onDeleteAccount: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onUpdateProfile, onDeleteAccount }) => {
  const [profile, setProfile] = useState<UserProfile>({
    username: '사용자',
    email: 'user@example.com',
    phone: '010-1234-5678',
    childName: '아기',
    childBirthday: '2024-01-01'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  const handleEdit = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfile(editedProfile);
    onUpdateProfile(editedProfile);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDeleteAccount();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">사용자 정보</Typography>
          <Box>
            <Button
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ mr: 1 }}
            >
              수정
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              color="error"
              onClick={() => setShowDeleteConfirm(true)}
            >
              계정 삭제
            </Button>
          </Box>
        </Box>

        {!isEditing ? (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>아이디:</strong> {profile.username}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>이메일:</strong> {profile.email}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>전화번호:</strong> {profile.phone}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>자녀 이름:</strong> {profile.childName}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>자녀 생년월일:</strong> {profile.childBirthday}
            </Typography>
          </Box>
        ) : (
          <Box component="form">
            <TextField
              fullWidth
              label="이메일"
              value={editedProfile.email}
              onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="전화번호"
              value={editedProfile.phone}
              onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="자녀 이름"
              value={editedProfile.childName}
              onChange={(e) => setEditedProfile({ ...editedProfile, childName: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="자녀 생년월일"
              type="date"
              value={editedProfile.childBirthday}
              onChange={(e) => setEditedProfile({ ...editedProfile, childBirthday: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={() => setIsEditing(false)}>취소</Button>
              <Button variant="contained" onClick={handleSave}>저장</Button>
            </Box>
          </Box>
        )}
      </Paper>

      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>계정 삭제 확인</DialogTitle>
        <DialogContent>
          <Typography>정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>취소</Button>
          <Button onClick={handleDelete} color="error">삭제</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile; 