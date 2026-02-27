import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Baby, Phone, Mail, Trash2, ChevronRight, CalendarDays, Check, X } from "lucide-react";
import type { UserProfile, ChildInfo } from "../types";
import "./Profile.css";

interface ProfileProps {
  userInfo: UserProfile;
  onUpdateProfile: (profile: UserProfile) => Promise<void> | void;
  onDeleteAccount: () => Promise<void> | void;
}

type Section = "child" | "account" | null;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

// 섹션 편집 드로어
const EditDrawer: React.FC<{
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, title, onClose, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/30 z-40"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 40 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-linen rounded-t-3xl shadow-lifted max-w-lg mx-auto"
        >
          <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-linen-deep">
            <h3 className="text-[16px] font-display font-bold text-ink">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-linen-dark text-cocoa-muted hover:text-cocoa transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-5 py-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// 공통 인풋
const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
}> = ({ label, value, onChange, type = "text", placeholder, disabled, hint }) => (
  <div>
    <label className="block text-[11px] font-semibold text-cocoa-muted mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-xl border border-linen-deep bg-white/60 px-3.5 py-2.5 text-[14px] text-cocoa placeholder:text-cocoa-muted/60 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra/50 transition disabled:opacity-50"
    />
    {hint && <p className="text-[11px] text-cocoa-muted mt-1">{hint}</p>}
  </div>
);

const Profile: React.FC<ProfileProps> = ({ userInfo, onUpdateProfile, onDeleteAccount }) => {
  const [openSection, setOpenSection] = useState<Section>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 아기 정보 편집 상태
  const [childName, setChildName] = useState(userInfo.child?.childName ?? "");
  const [childBirthday, setChildBirthday] = useState(userInfo.child?.childBirthday ?? "");

  // 계정 정보 편집 상태
  const [phone, setPhone] = useState(userInfo.phone ?? "");

  // openSection 변경 시 폼 초기화
  useEffect(() => {
    if (openSection === "child") {
      setChildName(userInfo.child?.childName ?? "");
      setChildBirthday(userInfo.child?.childBirthday ?? "");
    } else if (openSection === "account") {
      setPhone(userInfo.phone ?? "");
    }
    setSaved(false);
  }, [openSection, userInfo]);

  const handleSaveChild = async () => {
    setIsLoading(true);
    try {
      const updated: UserProfile = {
        ...userInfo,
        child: {
          ...(userInfo.child ?? {}),
          childName,
          childBirthday,
        } as ChildInfo,
      };
      await onUpdateProfile(updated);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpenSection(null);
      }, 1200);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAccount = async () => {
    setIsLoading(true);
    try {
      const updated: UserProfile = { ...userInfo, phone };
      await onUpdateProfile(updated);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpenSection(null);
      }, 1200);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await onDeleteAccount();
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const getDday = () => {
    if (!userInfo.child?.childBirthday) return null;
    const diff = Math.round(
      (new Date(userInfo.child.childBirthday).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (diff > 0) return `D-${diff}`;
    if (diff === 0) return "D-Day";
    return `D+${Math.abs(diff)}`;
  };
  const dday = getDday();

  return (
    <div className="max-w-lg mx-auto min-h-screen px-5 pt-6 pb-28">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">

        {/* 사용자 헤더 */}
        <motion.div variants={fadeUp} className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-terra/15 flex items-center justify-center border border-terra/20">
            <span className="text-2xl font-display font-bold text-terra">
              {userInfo.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-[20px] font-display font-bold text-ink">
              {userInfo.username}
            </h1>
            <p className="text-[13px] text-cocoa-muted">{userInfo.email}</p>
          </div>
          {dday && (
            <span className="ml-auto stamp text-terra">{dday}</span>
          )}
        </motion.div>

        {/* 아기 정보 카드 */}
        <motion.div variants={fadeUp}>
          <p className="text-[11px] font-bold tracking-widest text-cocoa-muted uppercase mb-2">
            아기 정보
          </p>
          <button
            onClick={() => setOpenSection("child")}
            className="w-full bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-paper border border-white/50 flex items-center gap-4 hover:shadow-paper-hover transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-terra/10 flex items-center justify-center shrink-0">
              <Baby className="w-5 h-5 text-terra" />
            </div>
            <div className="flex-1 min-w-0">
              {userInfo.child?.childName || userInfo.child?.childBirthday ? (
                <>
                  <p className="text-[15px] font-bold text-ink">
                    {userInfo.child.childName || "이름 미설정"}
                  </p>
                  <p className="text-[12px] text-cocoa-muted mt-0.5">
                    {userInfo.child.childBirthday
                      ? `출산 예정일: ${formatDateKr(userInfo.child.childBirthday)}`
                      : "예정일 미설정"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[14px] font-semibold text-terra">아기 정보 설정하기</p>
                  <p className="text-[12px] text-cocoa-muted mt-0.5">
                    태명, 출산 예정일을 입력하면 임신 주차가 계산돼요
                  </p>
                </>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-cocoa-muted shrink-0" />
          </button>
        </motion.div>

        {/* 계정 설정 */}
        <motion.div variants={fadeUp}>
          <p className="text-[11px] font-bold tracking-widest text-cocoa-muted uppercase mb-2">
            계정 설정
          </p>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-paper border border-white/50 overflow-hidden">
            <button
              onClick={() => setOpenSection("account")}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-linen/60 transition-colors border-b border-linen-deep"
            >
              <div className="w-8 h-8 rounded-lg bg-linen-dark flex items-center justify-center">
                <Phone className="w-4 h-4 text-cocoa-muted" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[13px] font-semibold text-ink">연락처</p>
                <p className="text-[12px] text-cocoa-muted">{userInfo.phone || "미입력"}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-cocoa-muted" />
            </button>
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-linen-deep">
              <div className="w-8 h-8 rounded-lg bg-linen-dark flex items-center justify-center">
                <Mail className="w-4 h-4 text-cocoa-muted" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[13px] font-semibold text-ink">이메일</p>
                <p className="text-[12px] text-cocoa-muted">{userInfo.email}</p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50/60 transition-colors text-red-400"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[13px] font-semibold">계정 삭제</p>
                <p className="text-[12px] opacity-70">모든 데이터가 삭제됩니다</p>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>
          </div>
        </motion.div>

        {/* 앱 정보 */}
        <motion.div variants={fadeUp} className="text-center pt-2">
          <p className="text-[11px] text-cocoa-muted">산모일기 v1.0</p>
        </motion.div>
      </motion.div>

      {/* 아기 정보 드로어 */}
      <EditDrawer
        isOpen={openSection === "child"}
        title="아기 정보"
        onClose={() => setOpenSection(null)}
      >
        <div className="space-y-3">
          <Field
            label="태명"
            value={childName}
            onChange={setChildName}
            placeholder="예) 콩이, 복덩이"
            disabled={isLoading}
          />
          <Field
            label="출산 예정일"
            value={childBirthday}
            onChange={setChildBirthday}
            type="date"
            disabled={isLoading}
            hint="예정일을 입력하면 임신 주차가 자동으로 계산돼요"
          />
          {childBirthday && (
            <div className="bg-terra/8 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-terra shrink-0" />
              <p className="text-[12px] text-terra font-medium">
                {getWeekEstimate(childBirthday)}
              </p>
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveChild}
            disabled={isLoading}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-sm mt-2 ${
              saved ? "bg-sage text-white" : "bg-terra text-white disabled:opacity-50"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {saved ? <><Check className="w-4 h-4" /> 저장 완료!</> : isLoading ? "저장 중..." : "저장"}
            </span>
          </motion.button>
        </div>
      </EditDrawer>

      {/* 계정 설정 드로어 */}
      <EditDrawer
        isOpen={openSection === "account"}
        title="계정 정보"
        onClose={() => setOpenSection(null)}
      >
        <div className="space-y-3">
          <Field
            label="전화번호"
            value={phone}
            onChange={setPhone}
            type="tel"
            placeholder="01012345678"
            disabled={isLoading}
          />
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveAccount}
            disabled={isLoading}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-sm mt-2 ${
              saved ? "bg-sage text-white" : "bg-terra text-white disabled:opacity-50"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {saved ? <><Check className="w-4 h-4" /> 저장 완료!</> : isLoading ? "저장 중..." : "저장"}
            </span>
          </motion.button>
        </div>
      </EditDrawer>

      {/* 계정 삭제 확인 모달 */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-5"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lifted border border-linen-deep"
              >
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-[17px] font-display font-bold text-ink">계정 삭제</h3>
                  <p className="text-cocoa text-[13px] mt-2 leading-relaxed">
                    정말 삭제하시겠어요?<br />
                    <span className="text-red-400 font-semibold">모든 일기와 기록이 영구 삭제됩니다.</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl border border-linen-deep text-[13px] text-cocoa-muted font-semibold"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl bg-red-400 text-white text-[13px] font-bold disabled:opacity-50"
                  >
                    {isLoading ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

function formatDateKr(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function getWeekEstimate(dueDate: string): string {
  try {
    const due = new Date(dueDate).getTime();
    const today = Date.now();
    const lmp = due - 280 * 24 * 60 * 60 * 1000;
    const daysSince = Math.floor((today - lmp) / (1000 * 60 * 60 * 24));
    const week = Math.floor(daysSince / 7) + 1;
    if (week < 1) return "아직 임신 시작 전이에요";
    if (week > 42) return "출산 예정일이 지났어요";
    return `현재 약 ${week}주차 (${week <= 13 ? "임신 초기" : week <= 27 ? "임신 중기" : "임신 후기"})`;
  } catch {
    return "";
  }
}

export default Profile;
