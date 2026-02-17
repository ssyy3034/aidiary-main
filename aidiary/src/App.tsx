import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// Components
import Login from "./components/Login";
import Register from "./components/Register";
import Diary from "./components/Diary";
import Profile from "./components/Profile";
import CharacterGenerator from "./components/CharacterGenerator";
import CharacterPersonalityBuilder from "./components/CharacterPersonalityBuilder";
import BottomTabBar from "./components/BottomTabBar";
import HomePage from "./components/HomePage";
import { PersonalityProvider } from "./components/PersonalityContext";

// Stores & API
import { useAuthStore, useUIStore } from "./stores";
import { authApi, userApi, childApi } from "./api/client";

// Types
import type { UserProfile } from "./types";

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

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    isAuthenticated,
    characterData,
    userInfo,
    login,
    logout,
    setCharacter,
    updateUserInfo,
  } = useAuthStore();
  const { setLoading, setError } = useUIStore();

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      if (!isAuthenticated || !token) return;
      try {
        const response = await userApi.getInfo();
        updateUserInfo({
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          phone: response.data.phone || "",
          child: response.data.child || null,
        });

        // ✅ 추가: 사용자 정보 로드 시 자녀 정보가 있다면 가져오기
        try {
          const childResponse = await childApi.getMe();
          if (childResponse.data) {
            setCharacter(childResponse.data);
          }
        } catch (childErr) {
          console.log("등록된 자녀 정보가 없습니다.");
        }
      } catch (error: any) {
        if (error.response?.status !== 401)
          console.error("사용자 정보 로드 실패:", error);
      }
    };
    validateToken();
  }, [isAuthenticated, updateUserInfo, setCharacter]);

  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login({ username, password });
      const { token, username: u, email, id, child } = response.data;
      login(token, { id, username: u, email, phone: "", child: child ?? null });

      // ✅ 추가: 로그인 직후 자녀 정보 가져오기
      try {
        const childResponse = await childApi.getMe();
        if (childResponse.data) {
          setCharacter(childResponse.data);
        }
      } catch (childErr) {
        console.log("등록된 자녀 정보가 없습니다.");
      }

      navigate("/");
    } catch (error: any) {
      setError("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    username: string,
    password: string,
    email: string,
    phone: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.signup({ username, password, email, phone });
      alert("회원가입이 완료되었습니다.");
      await handleLogin(username, password);
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "회원가입에 실패했습니다.";
      setError(message);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      logout();
      navigate("/login");
    }
  };

  const handleUpdateProfile = async (profile: UserProfile) => {
    setLoading(true);
    try {
      await userApi.updateProfile({
        phone: profile.phone,
        child: profile.child
          ? {
              childName: profile.child.childName,
              childBirthday: profile.child.meetDate,
            }
          : undefined,
      });
      updateUserInfo(profile);
      alert("프로필이 업데이트되었습니다.");
    } catch {
      alert("프로필 업데이트에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await userApi.deleteAccount();
      alert("계정이 삭제되었습니다.");
      logout();
      navigate("/login");
    } catch {
      alert("계정 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterCreated = async (character: CharacterData) => {
    setLoading(true);
    try {
      const response = await childApi.save(character);
      setCharacter(response.data);
      alert("캐릭터가 생성되었습니다!");
      navigate("/diary");
    } catch {
      alert("캐릭터 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalityGenerated = () => navigate("/character");

  return (
    <div className="min-h-screen bg-linen font-body text-cocoa">
      {/* Top bar */}
      {isAuthenticated && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-linen/95 border-b border-linen-deep h-12">
          <div className="max-w-lg mx-auto px-5 h-full flex items-center justify-between">
            <h1 className="text-[15px] font-display font-bold text-ink tracking-tight">
              산모일기
            </h1>
            <button
              onClick={handleLogout}
              className="text-[12px] text-cocoa-muted hover:text-terra transition-colors tracking-wide"
            >
              로그아웃
            </button>
          </div>
        </header>
      )}

      <main className={isAuthenticated ? "pt-12 pb-20" : ""}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <PageWrap>
                    <HomePage />
                  </PageWrap>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/" />
                ) : (
                  <PageWrap>
                    <Login onLogin={handleLogin} />
                  </PageWrap>
                )
              }
            />
            <Route
              path="/register"
              element={
                <PageWrap>
                  <Register onRegister={handleRegister} />
                </PageWrap>
              }
            />
            <Route
              path="/diary"
              element={
                isAuthenticated ? (
                  <PageWrap>
                    <Diary
                      key={characterData?.id || userInfo?.id || "default"}
                    />
                  </PageWrap>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/character"
              element={
                isAuthenticated ? (
                  <PageWrap>
                    <CharacterGenerator
                      onCharacterCreated={handleCharacterCreated}
                    />
                  </PageWrap>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/character-personality"
              element={
                isAuthenticated ? (
                  <PageWrap>
                    <CharacterPersonalityBuilder
                      onPersonalityGenerated={handlePersonalityGenerated}
                    />
                  </PageWrap>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/profile"
              element={
                isAuthenticated ? (
                  userInfo ? (
                    <PageWrap>
                      <Profile
                        userInfo={userInfo}
                        onUpdateProfile={handleUpdateProfile}
                        onDeleteAccount={handleDeleteAccount}
                      />
                    </PageWrap>
                  ) : (
                    <div className="flex justify-center py-20">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-terra" />
                    </div>
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </AnimatePresence>
      </main>

      {isAuthenticated && <BottomTabBar />}
    </div>
  );
};

const PageWrap = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    {children}
  </motion.div>
);

const App: React.FC = () => (
  <PersonalityProvider>
    <Router>
      <AppContent />
    </Router>
  </PersonalityProvider>
);

export default App;
