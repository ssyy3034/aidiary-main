import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import Diary from './components/Diary';
import Profile, { UserProfile } from './components/Profile';
import { AppBar, Toolbar, Typography, Button, IconButton, Box } from '@mui/material';
import { Menu as MenuIcon, AccountCircle as AccountIcon, ChildCare as ChildCareIcon } from '@mui/icons-material';
import CharacterPersonalityBuilder from './components/CharacterPersonalityBuilder';
import { PersonalityProvider } from './components/PersonalityContext';
import CharacterGenerator from "./components/CharacterGenerator"; // 추가

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

export interface AuthState {
  isAuthenticated: boolean;
  hasCharacter: boolean;
  characterData: CharacterData | null;
  userInfo: UserProfile | null;
}


const AppContent: React.FC = () => {
  const loadUserInfoFromStorage = (): UserProfile | null => {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (
          parsed &&
          typeof parsed.id === 'number' && !isNaN(parsed.id) &&
          typeof parsed.username === 'string' &&
          typeof parsed.email === 'string'
      ) {
        return parsed as UserProfile;
      } else {
        console.warn('userInfo 형식이 잘못됨:', parsed);
        return null;
      }
    } catch (e) {
      console.error('userInfo 파싱 오류:', e);
      return null;
    }
  };

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: !!localStorage.getItem('token'),
    hasCharacter: !!localStorage.getItem('characterData'),
    characterData: localStorage.getItem('characterData')
        ? JSON.parse(localStorage.getItem('characterData')!) as CharacterData
        : null,
    userInfo: loadUserInfoFromStorage(),
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!authState.isAuthenticated || authState.userInfo) return;

    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('http://localhost:8080/api/user/info', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user: UserProfile = {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          phone: response.data.phone || '',
          child: response.data.child || null,
        };

        localStorage.setItem('userInfo', JSON.stringify(user));
        setAuthState((prev) => ({ ...prev, userInfo: user }));
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      }
    };

    fetchUserInfo();
  }, [authState.isAuthenticated, authState.userInfo]);

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', { username, password });
      const { token, username: u, email, id, child } = response.data;

      const user: UserProfile = {
        id,
        username: u,
        email,
        phone: '',
        child: child ?? null,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('userInfo', JSON.stringify(user));

      setAuthState({
        isAuthenticated: true,
        hasCharacter: !!localStorage.getItem('characterData'),
        characterData: localStorage.getItem('characterData')
            ? JSON.parse(localStorage.getItem('characterData')!) as CharacterData
            : null,
        userInfo: user,
      });

      navigate('/');
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
    }
  };

  const handleRegister = async (username: string, password: string, email: string, phone: string) => {
    try {
      await axios.post('http://localhost:8080/api/auth/signup', { username, password, email, phone });
      alert('회원가입이 완료되었습니다. 자동으로 로그인됩니다.');
      await handleLogin(username, password);
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      if (error.response) {
        alert(error.response.data?.error || '회원가입에 실패했습니다. 다시 시도해주세요.');
      } else if (error.request) {
        alert('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        alert('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleUpdateProfile = async (profile: UserProfile) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:8080/api/user/profile', profile, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.setItem('userInfo', JSON.stringify(profile));
      setAuthState((prev) => ({ ...prev, userInfo: profile }));

      alert('프로필이 업데이트되었습니다.');
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      alert('프로필 업데이트에 실패했습니다.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:8080/api/user/delete', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('계정이 성공적으로 삭제되었습니다.');
      handleLogout();
    } catch (error) {
      console.error('계정 삭제 실패:', error);
      alert('계정 삭제에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post('http://localhost:8080/api/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('로그아웃 요청 실패:', error);
    } finally {
      localStorage.clear();
      setAuthState({
        isAuthenticated: false,
        hasCharacter: false,
        characterData: null,
        userInfo: null,
      });
      navigate('/');
    }
  };

  const handleCharacterCreated = async (character: CharacterData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/child/save', character, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const savedCharacterData = response.data;
      localStorage.setItem('characterData', JSON.stringify(savedCharacterData));

      setAuthState((prev) => ({
        ...prev,
        hasCharacter: true,
        characterData: savedCharacterData,
      }));

      alert('캐릭터가 성공적으로 생성되었습니다!');
      navigate('/diary');
    } catch (error) {
      console.error('캐릭터 생성 실패:', error);
      alert('캐릭터 생성에 실패했습니다.');
    }
  };

  return (
      <PersonalityProvider>
        {authState.isAuthenticated && (
            <AppBar position="fixed" sx={{ backgroundColor: '#fff0e6' }}>
              <Toolbar>
                <IconButton edge="start" sx={{ mr: 2, color: '#c2675a' }}>
                  <MenuIcon />
                </IconButton>
                <Typography sx={{ flexGrow: 1, color: '#c2675a', fontWeight: 600 }}>
                  AI 산모 일기
                </Typography>
                <Button onClick={() => navigate('/character')} sx={{ color: '#c2675a' }} startIcon={<ChildCareIcon />}>
                  캐릭터
                </Button>
                <Button onClick={() => navigate('/diary')} sx={{ color: '#c2675a' }}>
                  다이어리
                </Button>
                <Button onClick={() => navigate('/character-personality')} sx={{ color: '#c2675a' }}>
                  성격 생성
                </Button>
                <Button onClick={() => navigate('/profile')} sx={{ color: '#c2675a' }} startIcon={<AccountIcon />}>
                  프로필
                </Button>
                <Button onClick={handleLogout} sx={{ color: '#c2675a' }}>
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
                      <Diary authState={authState} />
                  ) : (
                      <Login onLogin={handleLogin} />
                  )
                }
            />
            <Route path="/register" element={<Register onRegister={handleRegister} />} />
            <Route
                path="/character-personality"
                element={
                  authState.isAuthenticated ? (
                      <CharacterPersonalityBuilder
                          onPersonalityGenerated={(result: string) => {
                            console.log('생성된 아이 성격:', result);
                          }}
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
                      <Diary authState={authState} />
                  ) : (
                      <Navigate to="/" />
                  )
                }
            />
            <Route
                path="/profile"
                element={
                  authState.isAuthenticated ? (
                      authState.userInfo ? (
                          <Profile
                              userInfo={authState.userInfo}
                              onUpdateProfile={handleUpdateProfile}
                              onDeleteAccount={handleDeleteAccount}
                          />
                      ) : (
                          <Typography sx={{ mt: 10, textAlign: 'center' }}>
                            사용자 정보를 불러오는 중입니다...
                          </Typography>
                      )
                  ) : (
                      <Navigate to="/" />
                  )
                }
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
          </Routes>

        </Box>
      </PersonalityProvider>
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
