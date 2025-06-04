import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { Menu as MenuIcon, AccountCircle as AccountIcon, ChildCare as ChildCareIcon } from '@mui/icons-material';
import Login from './components/Login';
import Register from './components/Register';
import Diary from './components/Diary';
import Profile from './components/Profile';
import CharacterGenerator from './components/CharacterGenerator';
import api from './api';

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

interface AuthState {
  isAuthenticated: boolean;
  hasCharacter: boolean;
  characterData: string | null;
}

interface CharacterGeneratorProps {
  onCharacterCreated: (characterData: CharacterData) => Promise<void>;
  existingCharacter: CharacterData | null;
}

const AppContent: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: !!localStorage.getItem('token'),
    hasCharacter: !!localStorage.getItem('characterData'),
    characterData: localStorage.getItem('characterData')
        ? JSON.parse(localStorage.getItem('characterData')!)
        : null
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const navigate = useNavigate();

  React.useEffect(() => {
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: !!token
    }));
  }, [token]);

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await api.post('/api/v1/auth/login', {
        username,
        password
      });

      const { token } = response.data;
      localStorage.setItem('token', token);
      setToken(token);

      const savedCharacterData = localStorage.getItem('characterData');
      setAuthState({
        isAuthenticated: true,
        hasCharacter: !!savedCharacterData,
        characterData: savedCharacterData ? JSON.parse(savedCharacterData) : null
      });

      navigate('/'); // 로그인 후 메인 페이지(다이어리)로 이동
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
    }
  };

  const handleRegister = async (username: string, password: string, email: string, phone: string) => {
    try {
      await api.post('/api/v1/auth/signup', {
        username,
        password,
        email,
        phone
      });
      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      navigate('/');
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      if (error.response) {
        alert(error.response.data || '회원가입에 실패했습니다. 다시 시도해주세요.');
      } else if (error.request) {
        alert('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        alert('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleUpdateProfile = async (profile: any) => {
    try {
      await api.put('/api/v1/user/profile', profile, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert('프로필이 업데이트되었습니다.');
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      alert('프로필 업데이트에 실패했습니다.');
    }
  };

  const handleCharacterCreated = async (characterData: CharacterData) => {
    try {
      const response = await api.post(
          '/api/child/save',
          characterData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
      );

      const savedCharacterData = response.data;
      localStorage.setItem('characterData', JSON.stringify(savedCharacterData));

      setAuthState(prev => ({
        ...prev,
        hasCharacter: true,
        characterData: savedCharacterData
      }));

      navigate('/diary');
    } catch (error) {
      console.error('캐릭터 생성 실패:', error);
      alert('캐릭터 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/api/v1/user', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      handleLogout();
      alert('계정이 삭제되었습니다.');
    } catch (error) {
      console.error('계정 삭제 실패:', error);
      alert('계정 삭제에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('characterData');
    setToken(null);
    setAuthState({
      isAuthenticated: false,
      hasCharacter: false,
      characterData: null
    });
    navigate('/');
  };

  return (
      <>
        {authState.isAuthenticated && (
            <AppBar
                position="fixed"
                sx={{
                  backgroundColor: '#fff0e6',
                  boxShadow: '0 2px 4px rgba(194, 103, 90, 0.1)'
                }}
            >
              <Toolbar>
                <IconButton
                    size="large"
                    edge="start"
                    sx={{
                      mr: 2,
                      color: '#c2675a'
                    }}
                    aria-label="menu"
                >
                  <MenuIcon />
                </IconButton>

                <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      flexGrow: 1,
                      color: '#c2675a',
                      fontWeight: 600,
                      fontSize: '1.4rem',
                      fontFamily: "'Noto Sans KR', sans-serif"
                    }}
                >
                  AI 육아 다이어리
                </Typography>

                <Button
                    onClick={() => navigate('/character')}
                    startIcon={<ChildCareIcon />}
                    sx={{
                      color: '#c2675a',
                      mx: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(194, 103, 90, 0.1)'
                      }
                    }}
                >
                  캐릭터
                </Button>

                <Button
                    onClick={() => navigate('/diary')}
                    sx={{
                      color: '#c2675a',
                      mx: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(194, 103, 90, 0.1)'
                      }
                    }}
                >
                  다이어리
                </Button>

                <Button
                    onClick={() => navigate('/profile')}
                    startIcon={<AccountIcon />}
                    sx={{
                      color: '#c2675a',
                      mx: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(194, 103, 90, 0.1)'
                      }
                    }}
                >
                  프로필
                </Button>

                <Button
                    onClick={handleLogout}
                    sx={{
                      color: '#c2675a',
                      ml: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(194, 103, 90, 0.1)'
                      }
                    }}
                >
                  로그아웃
                </Button>
              </Toolbar>
            </AppBar>
        )}

        {authState.isAuthenticated && <Toolbar />}

        <Box>
          <Routes>
            <Route
                path="/"
                element={
                  authState.isAuthenticated ? (
                      <Diary />
                  ) : (
                      <Login onLogin={handleLogin} />
                  )
                }
            />
            <Route
                path="/register"
                element={<Register onRegister={handleRegister} />}
            />
            <Route
                path="/character"
                element={
                  authState.isAuthenticated ? (
                      <CharacterGenerator
                          onCharacterCreated={handleCharacterCreated}
                          existingCharacter={authState.characterData}
                      />
                  ) : (
                      <Navigate to="/" />
                  )
                }
            />
            <Route
                path="/diary"
                element={
                  authState.isAuthenticated ? (
                      <Diary />
                  ) : (
                      <Navigate to="/" />
                  )
                }
            />
            <Route
                path="/profile"
                element={
                  authState.isAuthenticated ? (
                      <Profile
                          onUpdateProfile={handleUpdateProfile}
                          onDeleteAccount={handleDeleteAccount}
                      />
                  ) : (
                      <Navigate to="/" />
                  )
                }
            />
          </Routes>
        </Box>
      </>
  );
};

const App: React.FC = () => {
  return (
      <Router>
        <AppContent />
      </Router>
  );
};

export default App;