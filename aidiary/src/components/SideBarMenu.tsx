import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Menu, X, Book, Users, Sparkles, User, LogOut } from "lucide-react";

interface SidebarProps {
  onLogout: () => void;
}

const SidebarMenu: React.FC<SidebarProps> = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: "다이어리", icon: Book, path: "/diary" },
    { text: "우리 아이", icon: Users, path: "/character" },
    { text: "성격 분석", icon: Sparkles, path: "/character-personality" },
    { text: "내 프로필", icon: User, path: "/profile" },
  ];

  const sidebarVariants: Variants = {
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
      },
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    closed: { x: -20, opacity: 0 },
    open: { x: 0, opacity: 1 },
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-paper/80 backdrop-blur-md border-b border-sand/50 h-16">
        <div className="max-w-screen-xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 -ml-2 rounded-full hover:bg-black/5 text-ink transition-colors"
              aria-label="메뉴 열기"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-serif font-medium text-ink">
              AI 산모 일기
            </h1>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />

            {/* Sidebar */}
            <motion.aside
              initial="closed"
              animate="open"
              exit="closed"
              variants={sidebarVariants}
              className="fixed top-0 left-0 h-full w-80 bg-paper border-r border-sand shadow-2xl z-50 overflow-hidden"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%235C6B4D' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
              }}
            >
              <div className="p-6 flex justify-between items-center border-b border-sand">
                <h2 className="text-2xl font-serif font-bold text-primary">
                  Menu
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-sand/30 text-ink/60 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <motion.button
                      key={item.path}
                      variants={itemVariants}
                      onClick={() => {
                        navigate(item.path);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium shadow-sm"
                          : "text-ink/80 hover:bg-black/5 hover:text-ink hover:translate-x-1"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isActive ? "text-primary" : "text-ink/60"}`}
                      />
                      <span className="font-sans text-lg">{item.text}</span>
                    </motion.button>
                  );
                })}
              </nav>

              <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-sand bg-paper/50 backdrop-blur-sm">
                <motion.button
                  variants={itemVariants}
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">로그아웃</span>
                </motion.button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SidebarMenu;
