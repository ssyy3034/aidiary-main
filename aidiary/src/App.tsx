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
import SidebarMenu from "./components/SideBarMenu";
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

/**
 * 메인 앱 콘텐츠 컴포넌트
 * Zustand 스토어를 활용하여 인증 상태 관리
 */
const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Zustand 스토어에서 상태와 액션 가져오기
  const {
    isAuthenticated,
    hasCharacter,
    characterData,
    userInfo,
    login,
    logout,
    setCharacter,
    updateUserInfo,
  } = useAuthStore();

  const { setLoading, setError } = useUIStore();

  // 인증된 사용자의 정보 로드 (토큰은 있지만 userInfo가 없을 때)
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!isAuthenticated || userInfo) return;

      try {
        const response = await userApi.getInfo();
        const user: UserProfile = {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          phone: response.data.phone || "",
          child: response.data.child || null,
        };
        updateUserInfo(user);
      } catch (error) {
        console.error("사용자 정보 로드 실패:", error);
      }
    };

    fetchUserInfo();
  }, [isAuthenticated, userInfo, updateUserInfo]);

  // ===== 인증 핸들러 =====
  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login({ username, password });
      const { token, username: u, email, id, child } = response.data;

      const user: UserProfile = {
        id,
        username: u,
        email,
        phone: "",
        child: child ?? null,
      };

      login(token, user);
      navigate("/");
    } catch (error: any) {
      console.error("로그인 실패:", error);
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
      alert("회원가입이 완료되었습니다. 자동으로 로그인됩니다.");
      await handleLogin(username, password);
    } catch (error: any) {
      console.error("회원가입 실패:", error);
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
    } catch (error) {
      console.error("로그아웃 요청 실패:", error);
    } finally {
      logout();
      navigate("/");
    }
  };

  // ===== 프로필 핸들러 =====
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
    } catch (error) {
      console.error("프로필 업데이트 실패:", error);
      alert("프로필 업데이트에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);

    try {
      await userApi.deleteAccount();
      alert("계정이 성공적으로 삭제되었습니다.");
      logout();
      navigate("/");
    } catch (error) {
      console.error("계정 삭제 실패:", error);
      alert("계정 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ===== 캐릭터 핸들러 =====
  const handleCharacterCreated = async (character: CharacterData) => {
    setLoading(true);

    try {
      const response = await childApi.save(character);
      const savedCharacter = response.data;

      setCharacter(savedCharacter);
      alert("캐릭터가 성공적으로 생성되었습니다!");
      navigate("/diary");
    } catch (error) {
      console.error("캐릭터 생성 실패:", error);
      alert("캐릭터 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalityGenerated = (result: any) => {
    console.log("성격 생성 완료:", result);
    navigate("/character");
  };

  return (
    <div className="min-h-screen bg-paper font-sans text-ink selection:bg-primary/20">
      {isAuthenticated && <SidebarMenu onLogout={handleLogout} />}

      <main
        className={`transition-all duration-300 ${isAuthenticated ? "pt-20 px-4 max-w-screen-xl mx-auto" : ""}`}
      >
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* 홈 / 로그인 */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <PageWrapper>
                    <Diary />
                  </PageWrapper>
                ) : (
                  <PageWrapper>
                    <Login onLogin={handleLogin} />
                  </PageWrapper>
                )
              }
            />

            {/* 회원가입 */}
            <Route
              path="/register"
              element={
                <PageWrapper>
                  <Register onRegister={handleRegister} />
                </PageWrapper>
              }
            />

            {/* 캐릭터 성격 빌더 */}
            <Route
              path="/character-personality"
              element={
                isAuthenticated ? (
                  <PageWrapper>
                    <CharacterPersonalityBuilder
                      onPersonalityGenerated={handlePersonalityGenerated}
                    />
                  </PageWrapper>
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* 일기 */}
            <Route
              path="/diary"
              element={
                isAuthenticated ? (
                  <PageWrapper>
                    <Diary
                      key={characterData?.id || userInfo?.id || "default"}
                    />
                  </PageWrapper>
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* 프로필 */}
            <Route
              path="/profile"
              element={
                isAuthenticated ? (
                  userInfo ? (
                    <PageWrapper>
                      <Profile
                        userInfo={userInfo}
                        onUpdateProfile={handleUpdateProfile}
                        onDeleteAccount={handleDeleteAccount}
                      />
                    </PageWrapper>
                  ) : (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* 캐릭터 생성 */}
            <Route
              path="/character"
              element={
                isAuthenticated ? (
                  <PageWrapper>
                    <CharacterGenerator
                      onCharacterCreated={handleCharacterCreated}
                    />
                  </PageWrapper>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
};

// Page Transition Wrapper
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

/**
 * 루트 App 컴포넌트
 */
const App: React.FC = () => {
  return (
    <PersonalityProvider>
      <Router>
        <AppContent />
      </Router>
    </PersonalityProvider>
  );
};

export default App;
