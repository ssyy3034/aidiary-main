import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './Register.css';

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

  const mainColor = '#fff0e6';
  const subColor = '#c2675a';

  // 기존 validation 함수들은 동일하게 유지
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

  // useEffect 훅들도 동일하게 유지
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

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      '& fieldset': {
        borderColor: subColor,
      },
      '&:hover fieldset': {
        borderColor: subColor,
      },
      '&.Mui-focused fieldset': {
        borderColor: subColor,
      }
    },
    '& .MuiInputLabel-root': {
      color: subColor,
      '&.Mui-focused': {
        color: subColor,
      }
    }
  };

  return (
      <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            px: 2,
            backgroundColor: mainColor
          }}
      >
        <Box sx={{ width: '100%', maxWidth: '450px' }}>
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 rounded-full blur-3xl opacity-25"
                   style={{ backgroundColor: subColor }}></div>
            </div>
            <div className="relative">
              <Typography
                  variant="h4"
                  align="center"
                  sx={{
                    color: subColor,
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    mb: 1
                  }}
              >
                Mom's Diary
              </Typography>
              <Typography
                  variant="subtitle1"
                  align="center"
                  sx={{ color: subColor }}
              >
                새로운 마음 만들기
              </Typography>
            </div>
          </div>

          <Paper
              elevation={0}
              sx={{
                p: 4,
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                borderRadius: '24px',
                border: `1px solid ${subColor}`,
                boxShadow: '0 8px 30px rgb(0,0,0,0.12)'
              }}
          >
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
                  sx={textFieldStyle}
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
                  sx={textFieldStyle}
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
                  sx={textFieldStyle}
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
                  helperText={emailError || "올바른 이메일 주소를 입력해주세요."}
                  sx={textFieldStyle}
              />
              <TextField
                  fullWidth
                  margin="normal"
                  label="전화번호"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  error={!!phoneError}
                  helperText={phoneError || "'-' 없이 숫자만 입력해주세요."}
                  sx={textFieldStyle}
              />

              <Button
                  fullWidth
                  type="submit"
                  sx={{
                    mt: 3,
                    py: 1.5,
                    backgroundColor: subColor,
                    color: 'white',
                    borderRadius: '16px',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#b35a4d',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(194, 103, 90, 0.5)',
                      color: 'white',
                    }
                  }}
                  disabled={!isFormValid}
              >
                가입하기
              </Button>

              <Button
                  fullWidth
                  sx={{
                    mt: 2,
                    py: 1.5,
                    backgroundColor: 'rgba(194, 103, 90, 0.1)',
                    color: subColor,
                    borderRadius: '16px',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(194, 103, 90, 0.2)',
                    }
                  }}
                  onClick={() => navigate('/')}
              >
                로그인으로 돌아가기
              </Button>
            </form>
          </Paper>

          <Typography
              variant="caption"
              align="center"
              sx={{
                display: 'block',
                mt: 3,
                color: subColor
              }}
          >
            <p>함께하는 임신과 출산의 여정</p>
            <p>당신의 모든 순간을 소중히 기록합니다</p>
          </Typography>
        </Box>
      </Box>
  );
};

export default Register;