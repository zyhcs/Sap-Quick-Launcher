import { useEffect } from 'react';
import { Theme } from '../types';

interface ToastProps {
  message: string;
  onClose: () => void;
  theme?: Theme;
}

export default function Toast({ message, onClose, theme = 'dark' }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isDark = theme === 'dark';

  return (
    <div className="fixed bottom-8 right-8 z-[3000] animate-slideUp">
      <div className={`rounded-xl px-5 py-3.5 flex items-center gap-3 ${
        isDark
          ? 'bg-[#12121A]/95 border border-white/[0.08] shadow-[0_0_30px_rgba(0,0,0,0.5)]'
          : 'bg-white border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
      }`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
          isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
        }`}>
          <i className={`ph-fill ph-check text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
        </div>
        <span className={`text-sm font-medium ${isDark ? 'text-white/90' : 'text-gray-700'}`}>{message}</span>
      </div>
    </div>
  );
}
