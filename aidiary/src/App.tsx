import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import Diary from './components/Diary';
import Profile from './components/Profile';
import CharacterGenerator from './components/CharacterGenerator';
import { AppBar, Toolbar, Typography, Button, IconButton, Box } from '@mui/material';
import { Menu as MenuIcon, AccountCircle as AccountIcon, ChildCare as ChildCareIcon } from '@mui/icons-material';
import { UserProfile } from './components/Profile';

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
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: !!localStorage.getItem('token'),
    hasCharacter: !!localStorage.getItem('characterData'),
    characterData: localStorage.getItem('characterData')
        ? JSON.parse(localStorage.getItem('characterData')!) as CharacterData
        : null,
    userInfo: localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo')!) as UserProfile
        : null,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!authState.isAuthenticated) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('http://localhost:8080/api/user/info', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        localStorage.setItem('userInfo', JSON.stringify(response.data));

        setAuthState((prev) => ({
          ...prev,
          userInfo: response.data,
        }));
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      }
    };

    fetchUserInfo();
  }, [authState.isAuthenticated]);

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', { username, password });
      const { token, username: u, email, role, id, child } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userInfo', JSON.stringify({ username: u, email, role, phone: '', child, id }));

      setAuthState({
        isAuthenticated: true,
        hasCharacter: !!localStorage.getItem('characterData'),
        characterData: localStorage.getItem('characterData')
            ? JSON.parse(localStorage.getItem('characterData')!) as CharacterData
            : null,
        userInfo: { username: u, email, phone: '', child, id },
      });

      navigate('/');
    } catch (error) {
      alert('로그인 실패');
    }
  };

  const handleRegister = async (username: string, password: string, email: string, phone: string) => {
    try {
      await axios.post('http://localhost:8080/api/auth/signup', { username, password, email, phone });
      alert('회원가입 완료');
      navigate('/');
    } catch (error) {
      alert('회원가입 실패');
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

      setAuthState((prev) => ({
        ...prev,
        userInfo: profile,
      }));

      alert('프로필이 업데이트되었습니다.');
    } catch (error) {
      alert('프로필 업데이트 실패');
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
      handleLogout();
    } catch (error) {
      alert('계정 삭제 실패');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setAuthState({
      isAuthenticated: false,
      hasCharacter: false,
      characterData: null,
      userInfo: null,
    });
    navigate('/');
  };

  const handleCharacterCreated = async (character: CharacterData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8080/api/child/save', character, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const saved = res.data;
      localStorage.setItem('characterData', JSON.stringify(saved));

      setAuthState((prev) => ({
        ...prev,
        hasCharacter: true,
        characterData: saved,
      }));

      navigate('/diary');
    } catch (err) {
      alert('캐릭터 생성 성공!');
    }
  };

  return (
      <>
        {authState.isAuthenticated && (
            <AppBar position="fixed" sx={{ backgroundColor: '#fff0e6' }}>
              <Toolbar>
                <IconButton edge="start" sx={{ mr: 2, color: '#c2675a' }}><MenuIcon /></IconButton>
                <Typography sx={{ flexGrow: 1, color: '#c2675a', fontWeight: 600 }}>AI 육아 다이어리</Typography>
                <Button onClick={() => navigate('/character')} sx={{ color: '#c2675a' }} startIcon={<ChildCareIcon />}>캐릭터</Button>
                <Button onClick={() => navigate('/diary')} sx={{ color: '#c2675a' }}>다이어리</Button>
                <Button onClick={() => navigate('/profile')} sx={{ color: '#c2675a' }} startIcon={<AccountIcon />}>프로필</Button>
                <Button onClick={handleLogout} sx={{ color: '#c2675a' }}>로그아웃</Button>
              </Toolbar>
            </AppBar>
        )}

        {authState.isAuthenticated && <Toolbar />}

          <Box>
            <Routes>
              <Route
                  path="/"
                  element={
                    authState.isAuthenticated
                        ? <Diary authState={authState} />
                        : <Login onLogin={handleLogin} />
                  }
              />
              <Route
                  path="/register"
                  element={<Register onRegister={handleRegister} />}
              />
              <Route
                  path="/character"
                  element={
                    authState.isAuthenticated
                        ? <CharacterGenerator
                            onCharacterCreated={handleCharacterCreated}
                            existingCharacter={authState.characterData}
                        />
                        : <Navigate to="/" />
                  }
              />
              <Route
                  path="/diary"
                  element={
                    authState.isAuthenticated
                        ? <Diary authState={authState} />
                        : <Navigate to="/" />
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
                            <Typography sx={{ mt: 10, textAlign: 'center' }}>사용자 정보를 불러오는 중입니다...</Typography>
                        )
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
