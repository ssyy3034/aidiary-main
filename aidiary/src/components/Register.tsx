import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface RegisterProps {
  onRegister: (username: string, password: string, email: string, phone: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const navigate = useNavigate();

  const validateUsername = (username: string) => {
    if (!username) return '';
    if (username.length < 3) return '아이디는 3자 이상이어야 합니다.';
    if (!/^[a-zA-Z0-9]+$/.test(username)) return '영문자와 숫자만 사용 가능합니다.';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return '';
    const hasMinLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasMinLength) return '비밀번호는 8자 이상이어야 합니다.';
    if (!hasLetter) return '영문자를 포함해야 합니다.';
    if (!hasNumber) return '숫자를 포함해야 합니다.';
    if (!hasSpecialChar) return '특수문자를 포함해야 합니다.';
    return '';
  };

  const validateEmail = (email: string) => {
    if (!email) return '';
    // 일반적인 이메일 도메인만 허용 (.com, .net, .co.kr, .kr, .org 등)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|net|co\.kr|kr|org|edu|gov|biz|info)$/;
    if (!emailRegex.test(email)) return '올바른 이메일 주소를 입력해주세요. (예: example@naver.com)';
    return '';
  };

  const validatePhone = (phone: string) => {
    if (!phone) return '';
    const phoneRegex = /^01[0-9]{9}$/;
    if (!phoneRegex.test(phone)) return '올바른 전화번호를 입력해주세요. (예: 01012345678)';
    return '';
  };

  useEffect(() => {
    setUsernameError(validateUsername(username));
  }, [username]);

  useEffect(() => {
    setPasswordError(validatePassword(password));
  }, [password]);

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
    } else {
      setConfirmPasswordError('');
    }
  }, [password, confirmPassword]);

  useEffect(() => {
    setEmailError(validateEmail(email));
  }, [email]);

  useEffect(() => {
    setPhoneError(validatePhone(phone));
  }, [phone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError || passwordError || confirmPasswordError || emailError || phoneError) {
      alert('입력 정보를 확인해주세요.');
      return;
    }
    if (password === confirmPassword) {
      onRegister(username, password, email, phone);
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  const isFormValid = !usernameError && !passwordError && !confirmPasswordError && 
                     !emailError && !phoneError && username && password && 
                     confirmPassword && email && phone;

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          회원가입
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            error={!!usernameError}
            helperText={usernameError || "영문자와 숫자만 사용 가능합니다. (3자 이상)"}
          />
          <TextField
            fullWidth
            margin="normal"
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={!!passwordError}
            helperText={passwordError || "영문자, 숫자, 특수문자를 포함한 8자 이상"}
          />
          <TextField
            fullWidth
            margin="normal"
            label="비밀번호 확인"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            error={!!confirmPasswordError}
            helperText={confirmPasswordError}
          />
          <TextField
            fullWidth
            margin="normal"
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={!!emailError}
            helperText={emailError || "올바른 이메일 주소를 입력해주세요. (예: example@naver.com)"}
          />
          <TextField
            fullWidth
            margin="normal"
            label="전화번호"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            error={!!phoneError}
            helperText={phoneError || "'-' 없이 숫자만 입력해주세요. (예: 01012345678)"}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={!isFormValid}
          >
            가입하기
          </Button>
          <Button
            fullWidth
            variant="text"
            sx={{ mt: 1 }}
            onClick={() => navigate('/')}
          >
            로그인으로 돌아가기
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Register; 