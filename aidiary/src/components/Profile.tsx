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
    Divider
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    Save as SaveIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';

interface ChildProfile {
    childName: string;
    meetDate: string; // 임산부 앱에서는 생년월일 대신 만나는 예정일로 변경
}

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    phone: string;
    child: ChildProfile;
}

interface ProfileProps {
    userInfo: UserProfile;
    onUpdateProfile: (profile: UserProfile) => void;
    onDeleteAccount: () => void;
}

const Profile: React.FC<ProfileProps> = ({ userInfo, onUpdateProfile, onDeleteAccount }) => {
    const defaultChild: ChildProfile = { childName: '', meetDate: '' };

    const [profile, setProfile] = useState<UserProfile>({
        ...userInfo,
        child: userInfo.child ?? defaultChild,
    });

    const [editedProfile, setEditedProfile] = useState<UserProfile>({
        ...userInfo,
        child: userInfo.child ?? defaultChild,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const mainColor = '#fff0e6';
    const subColor = '#c2675a';

    const textFieldStyle = {
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
    };

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
        <Box sx={{ p: 3, maxWidth: 800, width: '100%', mx: 'auto', backgroundColor: mainColor, minHeight: '100vh' }}>
            <Typography variant="h4" sx={{ textAlign: 'center', mb: 4, color: subColor, fontWeight: 'bold' }}>
                프로필 관리
            </Typography>

            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, backgroundColor: '#ffffff', border: `1px solid ${subColor}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Avatar sx={{ width: 80, height: 80, bgcolor: subColor, mr: 3 }}>
                        <PersonIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 'bold' }}>{profile.username}</Typography>
                        <Typography variant="subtitle1" sx={{ color: '#7f8c8d' }}>{profile.email}</Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 4 }} />

                {!isEditing ? (
                    <Box sx={{ '& > *': { mb: 3 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="h6" sx={{ color: '#2c3e50' }}>개인정보</Typography>
                            <Box>
                                <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}
                                        sx={{ mr: 2, borderColor: subColor, color: subColor, '&:hover': { borderColor: '#2980b9', backgroundColor: 'rgba(194, 103, 90, 0.1)' } }}>
                                    수정
                                </Button>
                                <Button variant="outlined" startIcon={<DeleteIcon />} onClick={() => setShowDeleteConfirm(true)}
                                        sx={{ borderColor: '#e74c3c', color: '#e74c3c', '&:hover': { borderColor: '#c0392b', backgroundColor: 'rgba(231, 76, 60, 0.1)' } }}>
                                    계정 삭제
                                </Button>
                            </Box>
                        </Box>

                        <Paper sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                            {[
                                { label: '이메일', value: profile.email },
                                { label: '전화번호', value: profile.phone },
                                { label: '아이 이름', value: profile.child.childName },
                                { label: '우리가 만나는 날', value: profile.child.meetDate || '입력되지 않음' },
                            ].map((item, index) => (
                                <Box key={index} sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
                                    <Typography sx={{ width: '30%', color: '#7f8c8d', fontWeight: 'bold' }}>{item.label}</Typography>
                                    <Typography sx={{ color: '#2c3e50' }}>{item.value}</Typography>
                                </Box>
                            ))}
                        </Paper>
                    </Box>
                ) : (
                    <Box component="form" sx={{ '& .MuiTextField-root': { mb: 3 } }}>
                        <Typography variant="h6" sx={{ mb: 3, color: subColor }}>정보 수정</Typography>

                        <TextField fullWidth label="이메일" type="email" value={editedProfile.email} onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })} sx={textFieldStyle} />
                        <TextField fullWidth label="전화번호" type="tel" value={editedProfile.phone} onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })} sx={textFieldStyle} />
                        <TextField fullWidth label="자녀 이름" type="text" value={editedProfile.child.childName} onChange={(e) => setEditedProfile({ ...editedProfile, child: { ...editedProfile.child, childName: e.target.value } })} sx={textFieldStyle} />
                        <TextField fullWidth label="우리가 만나는 날" type="date" InputLabelProps={{ shrink: true }} value={editedProfile.child.meetDate} onChange={(e) => setEditedProfile({ ...editedProfile, child: { ...editedProfile.child, meetDate: e.target.value } })} sx={textFieldStyle} />

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                            <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => setIsEditing(false)} sx={{ borderColor: '#7f8c8d', color: '#7f8c8d', '&:hover': { borderColor: '#95a5a6', backgroundColor: 'rgba(127, 140, 141, 0.1)' } }}>
                                취소
                            </Button>
                            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} sx={{ backgroundColor: subColor, '&:hover': { backgroundColor: '#b35a4d' } }}>
                                저장
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>

            <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} PaperProps={{ sx: { borderRadius: 2, p: 2 } }}>
                <DialogTitle sx={{ color: '#e74c3c' }}>계정 삭제 확인</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#2c3e50' }}>
                        정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteConfirm(false)} sx={{ color: '#7f8c8d' }}>취소</Button>
                    <Button onClick={handleDelete} sx={{ color: '#e74c3c', '&:hover': { backgroundColor: 'rgba(231, 76, 60, 0.1)' } }}>
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Profile;