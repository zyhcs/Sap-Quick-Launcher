import { Translations } from '../types';
import { Broadcast } from '@phosphor-icons/react';

interface EmptyStateProps {
  t: Translations;
}

export default function EmptyState({ t }: EmptyStateProps) {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center animate-reveal">
      <div className={`w-20 h-20 border rounded-2xl flex items-center justify-center mb-6 ${
        isDark
          ? 'bg-white/[0.03] border-white/[0.05]'
          : 'bg-gray-100 border-gray-200'
      }`}>
        <Broadcast size={40} weight="duotone" className={isDark ? 'text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-blue-500'} />
      </div>
      <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white/90' : 'text-gray-800'}`}>{t.empty.title}</h3>
      <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{t.empty.desc}</p>
    </div>
  );
}