import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  SxProps,
  Theme
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

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
      <Box sx={{
        p: 3,
        maxWidth: 800,
        mx: 'auto',
        backgroundColor: '#fafafa',
        minHeight: '100vh'
      }}>
        <Typography variant="h4"
                    sx={{
                      textAlign: 'center',
                      mb: 4,
                      color: '#2c3e50',
                      fontWeight: 'bold'
                    }}>
          프로필 관리
        </Typography>

        <Paper elevation={3}
               sx={{
                 p: 4,
                 borderRadius: 2,
                 backgroundColor: '#ffffff',
                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
               }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 4
          }}>
            <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: '#3498db',
                  mr: 3
                }}
            >
              <PersonIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
                {profile.username}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#7f8c8d' }}>
                {profile.email}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {!isEditing ? (
              <Box sx={{ '& > *': { mb: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#2c3e50' }}>
                    개인정보
                  </Typography>
                  <Box>
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={handleEdit}
                        sx={{
                          mr: 2,
                          borderColor: '#3498db',
                          color: '#3498db',
                          '&:hover': {
                            borderColor: '#2980b9',
                            backgroundColor: 'rgba(52, 152, 219, 0.1)'
                          }
                        }}
                    >
                      수정
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DeleteIcon />}
                        onClick={() => setShowDeleteConfirm(true)}
                        sx={{
                          borderColor: '#e74c3c',
                          color: '#e74c3c',
                          '&:hover': {
                            borderColor: '#c0392b',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)'
                          }
                        }}
                    >
                      계정 삭제
                    </Button>
                  </Box>
                </Box>

                <Paper sx={{
                  p: 3,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 2
                }}>
                  {[
                    { label: '이메일', value: profile.email },
                    { label: '전화번호', value: profile.phone },
                    { label: '자녀 이름', value: profile.childName },
                    { label: '자녀 생년월일', value: profile.childBirthday }
                  ].map((item, index) => (
                      <Box key={index} sx={{
                        display: 'flex',
                        mb: index !== 3 ? 2 : 0,
                        alignItems: 'center'
                      }}>
                        <Typography sx={{
                          width: '30%',
                          color: '#7f8c8d',
                          fontWeight: 'bold'
                        }}>
                          {item.label}
                        </Typography>
                        <Typography sx={{ color: '#2c3e50' }}>
                          {item.value}
                        </Typography>
                      </Box>
                  ))}
                </Paper>
              </Box>
          ) : (
              <Box component="form" sx={{ '& .MuiTextField-root': { mb: 3 } }}>
                <Typography variant="h6" sx={{ mb: 3, color: '#2c3e50' }}>
                  정보 수정
                </Typography>
                {[
                  { label: '이메일', field: 'email', type: 'email' },
                  { label: '전화번호', field: 'phone', type: 'tel' },
                  { label: '자녀 이름', field: 'childName', type: 'text' },
                  { label: '자녀 생년월일', field: 'childBirthday', type: 'date' }
                ].map((item) => (
                    <TextField
                        key={item.field}
                        fullWidth
                        label={item.label}
                        type={item.type}
                        value={editedProfile[item.field as keyof UserProfile]}
                        onChange={(e) => setEditedProfile({ ...editedProfile, [item.field]: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                    />
                ))}

                <Box sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  mt: 2
                }}>
                  <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => setIsEditing(false)}
                      sx={{
                        borderColor: '#7f8c8d',
                        color: '#7f8c8d',
                        '&:hover': {
                          borderColor: '#95a5a6',
                          backgroundColor: 'rgba(127, 140, 141, 0.1)'
                        }
                      }}
                  >
                    취소
                  </Button>
                  <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      sx={{
                        backgroundColor: '#2c3e50',
                        '&:hover': {
                          backgroundColor: '#34495e'
                        }
                      }}
                  >
                    저장
                  </Button>
                </Box>
              </Box>
          )}
        </Paper>

        <Dialog
            open={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            PaperProps={{
              sx: {
                borderRadius: 2,
                p: 2
              }
            }}
        >
          <DialogTitle sx={{ color: '#e74c3c' }}>
            계정 삭제 확인
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#2c3e50' }}>
              정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
                onClick={() => setShowDeleteConfirm(false)}
                sx={{ color: '#7f8c8d' }}
            >
              취소
            </Button>
            <Button
                onClick={handleDelete}
                sx={{
                  color: '#e74c3c',
                  '&:hover': {
                    backgroundColor: 'rgba(231, 76, 60, 0.1)'
                  }
                }}
            >
              삭제
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default Profile;