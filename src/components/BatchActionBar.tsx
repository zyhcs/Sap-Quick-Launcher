import { Translations, Theme } from '../types';
import { CheckSquare, Square, Rocket, Trash, X } from '@phosphor-icons/react';

interface BatchActionBarProps {
  selectedCount: number;
  t: Translations;
  theme: Theme;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBatchLaunch: () => void;
  onBatchDelete: () => void;
}

export default function BatchActionBar({
  selectedCount,
  t,
  theme,
  onSelectAll,
  onDeselectAll,
  onBatchLaunch,
  onBatchDelete,
}: BatchActionBarProps) {
  if (selectedCount === 0) return null;

  const isDark = theme === 'dark';

  return (
    <div className={`
      fixed bottom-6 right-6 z-50 animate-slide-up
      flex items-center gap-4 px-5 py-3 rounded-[var(--radius-xl)]
      shadow-xl backdrop-blur-xl
      ${isDark 
        ? 'bg-[var(--bg-card-solid)]/95 border border-[var(--border-default)]' 
        : 'bg-white/95 border border-gray-200'
      }
    `}>
      {/* 选中数量 */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center bg-[var(--primary-dim)]">
          <CheckSquare size={16} weight="fill" className="text-[var(--primary)]" />
        </div>
        <span className="text-sm font-bold text-[var(--text-primary)]">
          {selectedCount} {t.batch.selected}
        </span>
      </div>

      <div className={`w-px h-6 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSelectAll}
          className={`
            p-2 rounded-[var(--radius-md)] transition-all duration-200
            ${isDark ? 'hover:bg-white/10 text-[var(--text-secondary)]' : 'hover:bg-gray-100 text-gray-500'}
          `}
          title={t.batch.selectAll}
        >
          <CheckSquare size={18} />
        </button>
        <button
          onClick={onDeselectAll}
          className={`
            p-2 rounded-[var(--radius-md)] transition-all duration-200
            ${isDark ? 'hover:bg-white/10 text-[var(--text-secondary)]' : 'hover:bg-gray-100 text-gray-500'}
          `}
          title={t.batch.deselectAll}
        >
          <Square size={18} />
        </button>
      </div>

      <div className={`w-px h-6 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

      {/* 启动和删除 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBatchLaunch}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)]
            text-sm font-semibold transition-all duration-200
            bg-[var(--primary)] text-white
            hover:shadow-lg hover:shadow-[var(--primary)]/20
            hover:-translate-y-0.5
          `}
        >
          <Rocket size={16} weight="fill" />
          {t.batch.launch}
        </button>
        <button
          onClick={onBatchDelete}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)]
            text-sm font-semibold transition-all duration-200
            bg-red-500/15 text-red-500
            hover:bg-red-500/25
          `}
        >
          <Trash size={16} weight="fill" />
          {t.batch.delete}
        </button>
      </div>

      {/* 关闭按钮 */}
      <button
        onClick={onDeselectAll}
        className={`
          p-1.5 rounded-[var(--radius-md)] transition-all duration-200
          ${isDark ? 'hover:bg-white/10 text-[var(--text-tertiary)]' : 'hover:bg-gray-100 text-gray-400'}
        `}
      >
        <X size={14} />
      </button>
    </div>
  );
}
