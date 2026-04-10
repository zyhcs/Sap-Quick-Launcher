import { useState, useRef, useEffect } from 'react';
import { Connection, Translations, Theme } from '../types';
import { PencilSimple, Trash, Rocket, CheckSquare, Square, ShieldWarning, Flask, Code, PushPin } from '@phosphor-icons/react';
import Tooltip from './Tooltip';

interface ConnectionCardProps {
  conn: Connection;
  index: number;
  t: Translations;
  theme: Theme;
  onEdit: (conn: Connection) => void;
  onDelete: (conn: Connection) => void;
  onLaunch: (conn: Connection) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  /** 选择功能 */
  isSelected?: boolean;
  onToggleSelect?: () => void;
  /** 最近使用标记 */
  isRecent?: boolean;
}

export default function ConnectionCard({
  conn,
  index,
  t,
  theme,
  onEdit,
  onDelete,
  onLaunch,
  onContextMenu,
  isSelected = false,
  onToggleSelect,
  isRecent = false,
}: ConnectionCardProps) {
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const isDark = theme === 'dark';

  // 环境对应的颜色与图标
  const envStyles = {
    prd: { 
      gradient: 'from-red-500/20 to-orange-500/10',
      border: 'border-red-500/20',
      glow: 'rgba(239, 68, 68, 0.15)',
      text: 'text-red-400',
      btnGradient: 'from-red-500 to-orange-400',
      btnShadow: 'rgba(239, 68, 68, 0.25)',
      btnShadowHover: 'rgba(239, 68, 68, 0.35)',
      leftBorder: '#EF4444',
      icon: ShieldWarning,
    },
    qas: { 
      gradient: 'from-amber-500/20 to-yellow-500/10',
      border: 'border-amber-500/20',
      glow: 'rgba(245, 158, 11, 0.15)',
      text: 'text-amber-400',
      btnGradient: 'from-amber-500 to-yellow-400',
      btnShadow: 'rgba(245, 158, 11, 0.25)',
      btnShadowHover: 'rgba(245, 158, 11, 0.35)',
      leftBorder: '#F59E0B',
      icon: Flask,
    },
    dev: { 
      gradient: 'from-emerald-500/20 to-green-500/10',
      border: 'border-emerald-500/20',
      glow: 'rgba(34, 197, 94, 0.15)',
      text: 'text-emerald-400',
      btnGradient: 'from-emerald-500 to-teal-400',
      btnShadow: 'rgba(34, 197, 94, 0.25)',
      btnShadowHover: 'rgba(34, 197, 94, 0.35)',
      leftBorder: '#22C55E',
      icon: Code,
    },
  };

  const env = envStyles[conn.env];

  // 鼠标跟随光效
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });
    };

    card.addEventListener('mousemove', handleMouseMove);
    return () => card.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLaunch = () => {
    setIsLaunching(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsLaunching(false);
          setLaunchProgress(0);
          onLaunch(conn);
        }, 200);
      }
      setLaunchProgress(Math.min(progress, 100));
    }, 80);
  };

  return (
    <div
      ref={cardRef}
      style={{ 
        animationDelay: `${index * 50}ms`,
        '--mouse-x': `${mousePos.x}%`,
        '--mouse-y': `${mousePos.y}%`,
        '--env-border-color': env.leftBorder,
      } as React.CSSProperties}
      className={`
        group relative overflow-hidden
        soft-card p-5 animate-slide-up
        env-card-border
        ${isSelected ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg-primary)]' : ''}
        ${isLaunching ? 'scale-[1.01]' : ''}
        cursor-pointer
      `}
      onContextMenu={onContextMenu}
      onDoubleClick={() => { if (!isLaunching) handleLaunch(); }}
    >
      {/* 环境渐变背景 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${env.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* 玻璃镜片反光 - 跟随鼠标的椭圆高光 */}
      <div 
        className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          transform: 'translate(-50%, -50%)',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, 
            rgba(255,255,255,0.12) 0%, 
            rgba(255,255,255,0.06) 25%, 
            rgba(255,255,255,0.02) 50%, 
            transparent 70%)`,
          filter: 'blur(2px)',
        }}
      />

      {/* 玻璃镜片反光 - 对角线高光条纹 */}
      <div 
        className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          top: '-50%',
          left: `${mousePos.x - 30}%`,
          width: '60%',
          height: '200%',
          transform: 'rotate(25deg)',
          background: `linear-gradient(90deg, 
            transparent 0%, 
            rgba(255,255,255,0.03) 30%, 
            rgba(255,255,255,0.07) 48%, 
            rgba(255,255,255,0.1) 50%, 
            rgba(255,255,255,0.07) 52%, 
            rgba(255,255,255,0.03) 70%, 
            transparent 100%)`,
          filter: 'blur(1px)',
        }}
      />

      {/* 玻璃镜片反光 - 边缘散射微光 */}
      <div 
        className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-400"
        style={{
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          transform: 'translate(-50%, -50%)',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: `radial-gradient(circle, 
            rgba(255,255,255,0.18) 0%, 
            rgba(255,255,255,0.04) 40%, 
            transparent 70%)`,
        }}
      />

      {/* 内容层 */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* 选择框 */}
            {onToggleSelect && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  isDark 
                    ? 'hover:bg-white/10' 
                    : 'hover:bg-gray-100'
                } ${isSelected ? 'bg-[var(--primary-dim)]' : ''}`}
              >
                {isSelected ? (
                  <CheckSquare size={18} className="text-[var(--primary)]" weight="fill" />
                ) : (
                  <Square size={18} className={`${isDark ? 'text-white/30' : 'text-gray-300'} group-hover:opacity-70 transition-opacity`} />
                )}
              </button>
            )}

            {/* 最近使用标记 */}
            {isRecent && !conn.pinned && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--primary-dim)]">
                <Rocket size={10} className="text-[var(--primary)]" weight="fill" />
                <span className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-wide">{t.recent.tag}</span>
              </div>
            )}

            {/* 固定标记 */}
            {conn.pinned && (
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isDark ? 'bg-cyan-400/15' : 'bg-cyan-50'}`}>
                <PushPin size={10} className="text-cyan-400" weight="fill" />
                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wide">{t.recent.pinnedTag}</span>
              </div>
            )}

            {/* 名称和系统ID */}
            <div className="min-w-0">
              <h2 className={`text-base font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {conn.name}
              </h2>
              <p className={`text-xs font-mono ${isDark ? 'text-white/40' : 'text-gray-400'} mt-0.5`}>
                {conn.sysId}
              </p>
            </div>
          </div>

          {/* 环境标签 */}
          <div className={`env-tag ${conn.env === 'prd' ? 'env-prd' : conn.env === 'qas' ? 'env-qas' : 'env-dev'}`}>
            <env.icon size={12} weight="fill" />
            {conn.env === 'prd' ? t.env.prd : conn.env === 'qas' ? t.env.qas : t.env.dev}
          </div>
        </div>

        {/* 信息网格 */}
        <div className={`grid grid-cols-3 gap-3 p-3 rounded-xl mb-4 ${
          isDark 
            ? 'bg-white/[0.03] border border-white/[0.05]' 
            : 'bg-gray-50/80 border border-gray-100'
        }`}>
          <div className="text-center">
            <span className={`text-[10px] uppercase tracking-wider block mb-1 ${isDark ? 'text-white/35' : 'text-gray-400'}`}>
              {t.fields.client}
            </span>
            <span className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {conn.client}
            </span>
          </div>
          <div className="text-center border-x border-white/5">
            <span className={`text-[10px] uppercase tracking-wider block mb-1 ${isDark ? 'text-white/35' : 'text-gray-400'}`}>
              {t.fields.user}
            </span>
            <span className={`text-sm font-medium truncate block ${isDark ? 'text-white/85' : 'text-gray-700'}`}>
              {conn.user}
            </span>
          </div>
          <div className="text-center">
            <span className={`text-[10px] uppercase tracking-wider block mb-1 ${isDark ? 'text-white/35' : 'text-gray-400'}`}>
              {t.fields.lang}
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-white/85' : 'text-gray-700'}`}>
              {conn.lang || '-'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* 左侧操作按钮 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(conn)}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                isDark 
                  ? 'hover:bg-white/10 text-white/50 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
              }`}
              aria-label="Edit connection"
            >
              <PencilSimple size={16} />
            </button>
            <button
              onClick={() => onDelete(conn)}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                isDark 
                  ? 'hover:bg-red-500/15 text-white/50 hover:text-red-400' 
                  : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
              }`}
              aria-label="Delete connection"
            >
              <Trash size={16} />
            </button>
          </div>

          {/* 启动按钮 */}
          <Tooltip text={t.actions.launch} placement="top" theme={theme}>
            <button
              onClick={handleLaunch}
              disabled={isLaunching}
              className={`
                relative px-6 py-2.5 rounded-xl text-sm font-bold
                transition-all duration-300 flex items-center gap-2
                bg-gradient-to-r ${env.btnGradient}
                text-white
                ${isLaunching 
                  ? 'opacity-90 cursor-wait' 
                  : 'hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]'
                }
              `}
              style={{
                boxShadow: isLaunching 
                  ? `0 10px 25px -5px ${env.btnShadow}`
                  : `0 10px 15px -3px ${env.btnShadow}, 0 4px 6px -4px ${env.btnShadow}`,
              }}
              onMouseEnter={(e) => {
                if (!isLaunching) {
                  e.currentTarget.style.boxShadow = `0 20px 25px -5px ${env.btnShadowHover}, 0 8px 10px -6px ${env.btnShadow}`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 10px 15px -3px ${env.btnShadow}, 0 4px 6px -4px ${env.btnShadow}`;
              }}
            >
              {/* 启动进度环 */}
              {isLaunching && (
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `conic-gradient(from 0deg, transparent ${100 - launchProgress}%, rgba(255,255,255,0.25) ${100 - launchProgress}%, rgba(255,255,255,0.25) ${launchProgress}%, transparent ${launchProgress}%)`,
                    }}
                  />
                </div>
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Rocket size={16} weight="fill" className={isLaunching ? 'animate-pulse' : ''} />
                <span className="min-w-[40px] text-center">
                  {isLaunching ? `${Math.round(launchProgress)}%` : t.actions.launch}
                </span>
              </span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
