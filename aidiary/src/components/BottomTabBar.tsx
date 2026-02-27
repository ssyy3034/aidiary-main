import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, Baby, User, HeartPulse } from "lucide-react";

const tabs = [
  { label: "홈", icon: Home, path: "/" },
  { label: "일기", icon: BookOpen, path: "/diary" },
  { label: "건강", icon: HeartPulse, path: "/health" },
  { label: "우리아이", icon: Baby, path: "/character" },
  { label: "마이", icon: User, path: "/profile" },
];

const BottomTabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-linen border-t-2 border-linen-deep shadow-tab pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(tab.path);

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 py-2.5 transition-colors ${
                isActive ? "text-terra" : "text-cocoa-muted hover:text-cocoa"
              }`}
            >
              {/* Active indicator - like a bookmark tab */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-terra rounded-b-full" />
              )}
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.5} />
              <span
                className={`text-[10px] tracking-wide ${
                  isActive ? "font-bold" : "font-medium"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
