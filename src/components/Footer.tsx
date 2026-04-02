import { Translations, Theme } from '../types';
import { CheckCircle, WarningCircle, CheckSquare, Square, Rocket, Trash, X } from '@phosphor-icons/react';

interface FooterProps {
  t: Translations;
  theme: Theme;
  connectionCount: number;
  hasSapPath: boolean;
  hotkey?: string;
  // 批量操作相关
  selectedCount?: number;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onBatchLaunch?: () => void;
  onBatchDelete?: () => void;
}

export default function Footer({ 
  t, 
  theme, 
  connectionCount, 
  hasSapPath, 
  hotkey = 'Ctrl+Shift+Space',
  selectedCount = 0,
  onSelectAll,
  onDeselectAll,
  onBatchLaunch,
  onBatchDelete,
}: FooterProps) {
  const isDark = theme === 'dark';
  const showBatchActions = selectedCount > 0;

  // 解析快捷键为单个按键
  const parseHotkey = (hk: string) => {
    return hk.split('+').map(k => {
      const keyMap: Record<string, string> = {
        'Ctrl': 'Ctrl',
        'Control': 'Ctrl',
        'Shift': 'Shift',
        'Alt': 'Alt',
        'Space': 'Space',
        'Enter': 'Enter',
        'Tab': 'Tab',
        'Esc': 'Esc',
        'Escape': 'Esc',
      };
      return keyMap[k] || k.toUpperCase();
    });
  };

  const hotkeyParts = parseHotkey(hotkey);

  // 替换翻译字符串中的占位符
  const getSelectedText = () => {
    const text = t.batch.selected;
    return text.replace('{count}', String(selectedCount));
  };

  return (
    <footer className={`flex justify-between items-center px-6 py-2.5 border-t relative z-20 text-[11px] ${
      isDark
        ? 'bg-[#18181B]/80 border-white/5 text-white/50'
        : 'bg-white/80 border-gray-200 text-gray-500'
    } backdrop-blur-sm`}>
      {/* 左侧：快捷键信息 或 批量操作 */}
      <div data-tour="footer-hotkey" className="flex items-center gap-3">
        {showBatchActions ? (
          <>
            {/* 批量操作模式 */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--primary-dim)]">
              <CheckSquare size={14} weight="fill" className="text-[var(--primary)]" />
              <span className="text-sm font-semibold text-[var(--primary)]">
                {getSelectedText()}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={onSelectAll}
                className={`
                  p-1.5 rounded-md transition-all duration-200
                  ${isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-gray-100 text-gray-500'}
                `}
                title={t.batch.selectAll}
              >
                <CheckSquare size={16} />
              </button>
              <button
                onClick={onDeselectAll}
                className={`
                  p-1.5 rounded-md transition-all duration-200
                  ${isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-gray-100 text-gray-500'}
                `}
                title={t.batch.deselectAll}
              >
                <Square size={16} />
              </button>
            </div>

            <div className={`w-px h-4 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

            <div className="flex items-center gap-1.5">
              <button
                onClick={onBatchLaunch}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md
                  text-xs font-semibold transition-all duration-200
                  bg-[var(--primary)] text-white
                  hover:shadow-md hover:shadow-[var(--primary)]/20
                  hover:-translate-y-0.5
                `}
              >
                <Rocket size={14} weight="fill" />
                {t.batch.launch}
              </button>
              <button
                onClick={onBatchDelete}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md
                  text-xs font-semibold transition-all duration-200
                  bg-red-500/15 text-red-500
                  hover:bg-red-500/25
                `}
              >
                <Trash size={14} weight="fill" />
                {t.batch.delete}
              </button>
            </div>

            <button
              onClick={onDeselectAll}
              className={`
                p-1 rounded-md transition-all duration-200
                ${isDark ? 'hover:bg-white/10 text-white/40' : 'hover:bg-gray-100 text-gray-400'}
              `}
              title={t.batch.deselectAll}
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            {/* 正常模式：快捷键 */}
            <span className={isDark ? 'text-white/40' : 'text-gray-400'}>{t.shortcut}:</span>
            <div className="flex items-center gap-1">
              {hotkeyParts.map((key, i) => (
                <>
                  {i > 0 && <span className={isDark ? 'text-white/40' : 'text-gray-400'}>+</span>}
                  <span key={i} className={`font-mono px-2 py-0.5 rounded text-[10px] font-medium ${
                    isDark ? 'soft-inset text-white/60' : 'soft-inset text-gray-600'
                  }`}>{key}</span>
                </>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 右侧：连接数和SAP状态 */}
      <div className="flex items-center gap-4">
        <span className={isDark ? 'text-white/40' : 'text-gray-400'}>
          {connectionCount} {t.connections}
        </span>
        <div className="flex items-center gap-2">
          <span className={isDark ? 'text-white/40' : 'text-gray-400'}>SAP:</span>
          {hasSapPath ? (
            <span className={`flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`}>
              <CheckCircle size={12} weight="fill" />
              <span>OK</span>
            </span>
          ) : (
            <span className={`flex items-center gap-1 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
              <WarningCircle size={12} />
              <span>{t.notConfigured}</span>
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
