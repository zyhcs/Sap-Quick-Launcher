import { useState } from 'react';
import { Translations, Theme, Language } from '../types';
import Tooltip from './Tooltip';
import { Gear, MagnifyingGlass, X, FolderSimple, Plus, SquaresFour, ListBullets, Sun, Moon, Sparkle } from '@phosphor-icons/react';

interface HeaderProps {
  t: Translations;
  theme: Theme;
  lang: Language;
  onThemeChange: (theme: Theme) => void;
  onLangChange: (lang: Language) => void;
  onPathConfig: () => void;
  onAdd: () => void;
  onSettings: () => void;
  onManageGroups: () => void;
  /** 搜索框相关 */
  searchQuery: string;
  onSearchChange: (v: string) => void;
  showSearch: boolean;
  /** 视图切换相关 */
  viewMode: 'card' | 'list';
  onViewChange: (mode: 'card' | 'list') => void;
}

export default function Header({
  t,
  theme,
  lang,
  onThemeChange,
  onLangChange,
  onPathConfig,
  onAdd,
  onSettings,
  onManageGroups,
  searchQuery,
  onSearchChange,
  showSearch,
  viewMode,
  onViewChange,
}: HeaderProps) {
  const isDark = theme === 'dark';
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className={`
      flex justify-between items-center px-5 py-3.5 relative z-20 gap-3
      ${isDark 
        ? 'bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-white/[0.06]' 
        : 'bg-white/80 backdrop-blur-xl border-b border-gray-100'
      }
    `}>
      {/* 左侧：设置按钮 + 搜索框 + 分组按钮 */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Tooltip text={t.tooltip.settings} placement="bottom" theme={theme}>
          <button
            onClick={onSettings}
            className={`
              rounded-xl flex items-center justify-center transition-all duration-200
              ${isDark
                ? 'soft-btn text-white/60 hover:text-white p-2.5'
                : 'soft-btn text-gray-500 hover:text-gray-800 p-2.5'
              }
            `}
          >
            <Gear size={18} />
          </button>
        </Tooltip>

        {/* 增强版搜索框 */}
        {showSearch && (
          <div 
            className={`
              relative flex items-center flex-1 max-w-[280px]
              group
            `}
          >
            {/* 发光效果 */}
            <div className={`
              absolute inset-0 rounded-xl transition-all duration-300
              ${searchFocused 
                ? 'opacity-100 scale-[1.02]' 
                : 'opacity-0 scale-100'
              }
              ${isDark 
                ? 'shadow-[0_0_20px_rgba(34,197,94,0.15),0_0_40px_rgba(34,197,94,0.08)]' 
                : 'shadow-[0_0_15px_rgba(34,197,94,0.12)]'
              }
            `} />
            
            {/* 搜索框容器 */}
            <div className={`
              relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300 flex-1
              ${isDark 
                ? 'bg-white/[0.04] border border-white/[0.08]' 
                : 'bg-gray-50/80 border border-gray-200/60'
              }
              ${searchFocused 
                ? (isDark 
                    ? 'bg-white/[0.06] border-[var(--primary)]/40 shadow-lg' 
                    : 'bg-white border-[var(--primary)]/30 shadow-md')
                : ''
              }
              hover:${isDark ? 'bg-white/[0.05]' : 'bg-gray-100/80'}
            `}>
              {/* 搜索图标 - 聚焦时有动画 */}
              <MagnifyingGlass 
                size={16} 
                weight={searchFocused ? 'bold' : 'regular'}
                className={`
                  transition-all duration-300
                  ${searchFocused 
                    ? 'text-[var(--primary)] scale-110' 
                    : (isDark ? 'text-white/40' : 'text-gray-400')
                  }
                `} 
              />
              
              {/* 输入框 */}
              <input
                data-tour="search"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder={lang === 'zh' ? '搜索连接…' : 'Search connections…'}
                className={`
                  flex-1 bg-transparent outline-none text-sm min-w-0 transition-all duration-200
                  ${isDark 
                    ? 'text-white/90 placeholder:text-white/30' 
                    : 'text-gray-800 placeholder:text-gray-400'
                  }
                `}
              />
              
              {/* 清除按钮 */}
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className={`
                    flex-shrink-0 transition-all duration-200 p-1 rounded-lg
                    ${isDark 
                      ? 'text-white/30 hover:text-white/60 hover:bg-white/10' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  <X size={14} />
                </button>
              )}
              
              {/* 搜索时的闪烁效果 */}
              {searchFocused && (
                <Sparkle 
                  size={12} 
                  weight="fill"
                  className="text-[var(--primary)] animate-pulse"
                />
              )}
            </div>
          </div>
        )}

        {/* 分组管理按钮 */}
        {showSearch && (
          <Tooltip text={t.group.title} placement="bottom" theme={theme}>
            <button
              onClick={onManageGroups}
              className={`
                rounded-xl flex items-center justify-center transition-all duration-200
                ${isDark
                  ? 'soft-btn text-white/60 hover:text-white p-2.5'
                  : 'soft-btn text-gray-500 hover:text-gray-800 p-2.5'
                }
              `}
            >
              <SquaresFour size={18} />
            </button>
          </Tooltip>
        )}

        {/* 视图切换按钮 */}
        {showSearch && (
          <Tooltip text={viewMode === 'card' ? (lang === 'zh' ? '列表视图' : 'List View') : (lang === 'zh' ? '卡片视图' : 'Card View')} placement="bottom" theme={theme}>
            <button
              onClick={() => onViewChange(viewMode === 'card' ? 'list' : 'card')}
              className={`
                rounded-xl flex items-center justify-center transition-all duration-200
                ${isDark
                  ? 'soft-btn text-white/60 hover:text-white p-2.5'
                  : 'soft-btn text-gray-500 hover:text-gray-800 p-2.5'
                }
              `}
            >
              {viewMode === 'card' ? <ListBullets size={16} /> : <SquaresFour size={16} />}
            </button>
          </Tooltip>
        )}
      </div>

      {/* 中部：SAP路径 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Tooltip text={t.tooltip.pathConfig} placement="bottom" theme={theme}>
          <button
            data-tour="sap-path"
            onClick={onPathConfig}
            className={`
              rounded-xl flex items-center gap-2 px-4 py-2.5 transition-all duration-200
              ${isDark
                ? 'soft-btn text-white/60 hover:text-white'
                : 'soft-btn text-gray-500 hover:text-gray-800'
              }
            `}
          >
            <FolderSimple size={18} />
            <span className="text-sm font-medium">{lang === 'zh' ? 'SAP路径' : 'SAP Path'}</span>
          </button>
        </Tooltip>
      </div>

      {/* 右侧：语言、主题切换与新建按钮 */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* 语言切换 */}
        <Tooltip text={lang === 'zh' ? '切换到 English' : '切换到 中文'} placement="bottom" theme={theme}>
          <button
            data-tour="theme-lang"
            onClick={() => onLangChange(lang === 'zh' ? 'en' : 'zh')}
            className={`
              relative flex items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200
              ${isDark 
                ? 'soft-btn text-white/60 hover:text-white' 
                : 'soft-btn text-gray-500 hover:text-gray-800'
              }
            `}
          >
            <span className={`text-xs font-bold ${lang === 'zh' ? 'text-[var(--primary)]' : ''}`}>
              {lang === 'zh' ? '中' : 'EN'}
            </span>
            <span className={`text-xs font-bold ${isDark ? 'text-white/30' : 'text-gray-300'}`}>
              /
            </span>
            <span className={`text-xs font-bold ${lang === 'en' ? 'text-[var(--primary)]' : ''}`}>
              {lang === 'zh' ? 'EN' : '中'}
            </span>
          </button>
        </Tooltip>

        {/* 主题切换 */}
        <Tooltip text={theme === 'dark' ? t.tooltip.lightTheme : t.tooltip.darkTheme} placement="bottom" theme={theme}>
          <button
            onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
            className={`
              relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300
              ${isDark 
                ? 'soft-btn text-amber-400 hover:text-amber-300' 
                : 'soft-btn text-indigo-500 hover:text-indigo-600'
              }
            `}
          >
            {theme === 'dark' ? <Sun size={20} weight="fill" /> : <Moon size={20} weight="fill" />}
          </button>
        </Tooltip>

        {/* 新建按钮 */}
        <Tooltip text={t.tooltip.add} placement="bottom" theme={theme}>
          <button
            data-tour="add-btn"
            onClick={onAdd}
            className="btn btn-primary px-5 py-2.5 text-sm"
          >
            <Plus size={18} weight="bold" />
            {t.buttons.add}
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
