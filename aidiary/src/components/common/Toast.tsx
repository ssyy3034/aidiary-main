import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ICONS = {
  success: <CheckCircle className="w-4 h-4 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 shrink-0" />,
  info: <Info className="w-4 h-4 shrink-0" />,
};

const STYLES = {
  success: "bg-white border-l-[3px] border-l-sage-dark text-cocoa",
  error: "bg-white border-l-[3px] border-l-red-400 text-cocoa",
  info: "bg-white border-l-[3px] border-l-terra text-cocoa",
};

const ICON_COLORS = {
  success: "text-sage-dark",
  error: "text-red-400",
  info: "text-terra",
};

const ToastMessage: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lifted border border-linen-deep/60 min-w-[260px] max-w-[340px] ${STYLES[toast.type]}`}
    >
      <span className={`mt-0.5 ${ICON_COLORS[toast.type]}`}>
        {ICONS[toast.type]}
      </span>
      <p className="flex-1 text-[13px] leading-relaxed font-body">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="mt-0.5 text-cocoa-muted hover:text-cocoa transition-colors shrink-0"
        aria-label="닫기"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-14 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastMessage toast={toast} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
