import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { Menu as MenuIcon, AccountCircle as AccountIcon } from '@mui/icons-material';
import Login from './components/Login';
import Register from './components/Register';
import Diary from './components/Diary';
import Profile from './components/Profile';
import axios from 'axios';

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const navigate = useNavigate();

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:8080/api/v1/auth/login', {
        username,
        password
      });
      
      const { token } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
    }
  };

  const handleRegister = async (username: string, password: string, email: string, phone: string) => {
    try {
      const response = await axios.post('http://localhost:8080/api/v1/auth/signup', {
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
        // 서버에서 응답이 왔지만 에러인 경우
        alert(error.response.data || '회원가입에 실패했습니다. 다시 시도해주세요.');
      } else if (error.request) {
        // 요청은 보냈지만 응답이 없는 경우
        alert('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        // 요청 설정 중 에러가 발생한 경우
        alert('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleUpdateProfile = async (profile: any) => {
    try {
      await axios.put('http://localhost:8080/api/v1/user/profile', profile, {
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

  const handleDeleteAccount = async () => {
    try {
      await axios.delete('http://localhost:8080/api/v1/user', {
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
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <>
      {isAuthenticated && (
        <AppBar position="static">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              AI 육아 다이어리
            </Typography>
            <Button color="inherit" href="/diary">
              다이어리
            </Button>
            <Button color="inherit" href="/profile">
              <AccountIcon sx={{ mr: 1 }} />
              프로필
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              로그아웃
            </Button>
          </Toolbar>
        </AppBar>
      )}
      <Box sx={{ mt: isAuthenticated ? 8 : 0 }}>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/diary" />
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
            path="/diary"
            element={
              isAuthenticated ? (
                <Diary />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/profile"
            element={
              isAuthenticated ? (
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
