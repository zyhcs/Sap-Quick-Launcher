import { useState, useEffect, useRef, useCallback } from 'react';
import { Theme, Language } from '../types';

// ==================== 引导步骤定义 ====================

export interface TourStep {
  id: string;
  /** 要高亮的元素选择器（CSS selector）*/
  targetSelector: string;
  /** 气泡位置偏好 */
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  title: { zh: string; en: string };
  desc: { zh: string; en: string };
  /** 高亮框形状 */
  shape?: 'rect' | 'circle';
  /** 额外边距 */
  padding?: number;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetSelector: '',
    placement: 'center',
    title: { zh: '👋 欢迎使用 SAP Quick Launcher', en: '👋 Welcome to SAP Quick Launcher' },
    desc: {
      zh: '这是你的 SAP 连接管理中心，接下来我们将用 30 秒带你熟悉核心功能。',
      en: 'This is your SAP connection hub. Let\'s take 30 seconds to explore the key features.'
    },
  },
  {
    id: 'sap-path',
    targetSelector: '[data-tour="sap-path"]',
    placement: 'bottom',
    title: { zh: '① 首先配置 SAP 路径', en: '① Configure SAP Path First' },
    desc: {
      zh: '点击这里设置 sapshcut.exe 的路径。没有这个路径，连接将无法启动。',
      en: 'Click here to set the path to sapshcut.exe. Without it, connections can\'t launch.'
    },
    padding: 8,
  },
  {
    id: 'add-connection',
    targetSelector: '[data-tour="add-btn"]',
    placement: 'bottom',
    title: { zh: '② 创建你的第一个连接', en: '② Create Your First Connection' },
    desc: {
      zh: '点击「新建」按钮，填写 SAP 系统信息（系统标识、客户端、用户名等）即可创建连接。',
      en: 'Click "NEW" to fill in SAP system info (System ID, Client, Username, etc.).'
    },
    padding: 8,
  },
  {
    id: 'search',
    targetSelector: '[data-tour="search"]',
    placement: 'bottom',
    title: { zh: '③ 搜索过滤连接', en: '③ Search & Filter' },
    desc: {
      zh: '在搜索框中输入关键词，可实时过滤连接列表，支持名称、系统标识、用户名匹配。',
      en: 'Type in the search box to filter connections in real-time by name, system ID, or username.'
    },
    padding: 6,
  },
  {
    id: 'theme-lang',
    targetSelector: '[data-tour="theme-lang"]',
    placement: 'bottom',
    title: { zh: '④ 主题 & 语言切换', en: '④ Theme & Language' },
    desc: {
      zh: '这里可以切换深色/浅色主题，以及中英文界面语言。',
      en: 'Switch between dark/light theme and Chinese/English language here.'
    },
    padding: 8,
  },
  {
    id: 'hotkey',
    targetSelector: '[data-tour="footer-hotkey"]',
    placement: 'top',
    title: { zh: '⑤ 全局快捷键', en: '⑤ Global Hotkey' },
    desc: {
      zh: '随时按下 Ctrl+Shift+Space 可以从任意窗口唤出/隐藏本程序，关闭窗口后软件也会常驻托盘。',
      en: 'Press Ctrl+Shift+Space anytime to show/hide from any window. Closing hides it to tray.'
    },
    padding: 8,
  },
  {
    id: 'context-menu',
    targetSelector: '',
    placement: 'center',
    title: { zh: '⑥ 右键菜单 & 更多', en: '⑥ Right-click Menu & More' },
    desc: {
      zh: '在连接卡片上右键可以「复制到新建」或「排序」。祝你使用愉快！🎉',
      en: 'Right-click a connection card to "Duplicate" or "Sort". Enjoy! 🎉'
    },
  },
];

// ==================== 工具函数 ====================

interface Rect { top: number; left: number; width: number; height: number }

function getTargetRect(selector: string, padding = 6): Rect | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top - padding,
    left: r.left - padding,
    width: r.width + padding * 2,
    height: r.height + padding * 2,
  };
}

function calcBubblePosition(
  rect: Rect | null,
  placement: TourStep['placement'],
  bubbleW: number,
  bubbleH: number,
  vw: number,
  vh: number
): { top: number; left: number; arrowDir: string } {
  if (!rect || placement === 'center') {
    return {
      top: vh / 2 - bubbleH / 2,
      left: vw / 2 - bubbleW / 2,
      arrowDir: '',
    };
  }

  const gap = 16;
  let top = 0;
  let left = 0;
  let arrowDir = '';

  switch (placement) {
    case 'bottom':
      top = rect.top + rect.height + gap;
      left = rect.left + rect.width / 2 - bubbleW / 2;
      arrowDir = 'top';
      break;
    case 'top':
      top = rect.top - bubbleH - gap;
      left = rect.left + rect.width / 2 - bubbleW / 2;
      arrowDir = 'bottom';
      break;
    case 'right':
      top = rect.top + rect.height / 2 - bubbleH / 2;
      left = rect.left + rect.width + gap;
      arrowDir = 'left';
      break;
    case 'left':
      top = rect.top + rect.height / 2 - bubbleH / 2;
      left = rect.left - bubbleW - gap;
      arrowDir = 'right';
      break;
  }

  // 边界钳制
  left = Math.max(12, Math.min(left, vw - bubbleW - 12));
  top = Math.max(12, Math.min(top, vh - bubbleH - 12));

  return { top, left, arrowDir };
}

// ==================== 主组件 ====================

interface OnboardingTourProps {
  theme: Theme;
  lang: Language;
  /** dontShowAgain: true = 勾选了"不再显示"，false = 没勾选（下次还显示）*/
  onFinish: (dontShowAgain: boolean) => void;
}

export default function OnboardingTour({ theme, lang, onFinish }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0, arrowDir: '' });
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true); // 默认勾选
  const bubbleRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;

  const updateLayout = useCallback(() => {
    const rect = current.targetSelector
      ? getTargetRect(current.targetSelector, current.padding ?? 6)
      : null;
    setTargetRect(rect);

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bw = 320;
    const bh = bubbleRef.current?.offsetHeight ?? 160;

    const pos = calcBubblePosition(rect, current.placement, bw, bh, vw, vh);
    setBubblePos(pos);
  }, [current]);

  // 步骤切换时更新布局
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => {
      updateLayout();
      setVisible(true);
    }, 80);
    return () => clearTimeout(t);
  }, [step, updateLayout]);

  // 窗口 resize 时重算
  useEffect(() => {
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  const goNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (!isFirst) setStep((s) => s - 1);
  };

  const handleFinish = (forceSkip = false) => {
    setVisible(false);
    // 跳过时不记录（不勾选=继续显示），点完成时按勾选状态
    setTimeout(() => onFinish(forceSkip ? false : dontShowAgain), 300);
  };

  const l = (obj: { zh: string; en: string }) => (lang === 'zh' ? obj.zh : obj.en);

  // 遮罩裁剪：如果有目标，创建一个"空洞"高亮
  const hasTarget = !!targetRect;

  return (
    <div
      className="fixed inset-0 z-[9000]"
      style={{ pointerEvents: 'none' }}
    >
      {/* ===== 遮罩层（四块遮盖 + 高亮框）===== */}
      {hasTarget && targetRect ? (
        <>
          {/* 上方遮罩 */}
          <div
            className="absolute bg-black/60"
            style={{
              top: 0, left: 0,
              width: '100%',
              height: targetRect.top,
              pointerEvents: 'auto',
            }}
            onClick={() => handleFinish(true)}
          />
          {/* 下方遮罩 */}
          <div
            className="absolute bg-black/60"
            style={{
              top: targetRect.top + targetRect.height,
              left: 0,
              width: '100%',
              bottom: 0,
              pointerEvents: 'auto',
            }}
            onClick={() => handleFinish(true)}
          />
          {/* 左侧遮罩 */}
          <div
            className="absolute bg-black/60"
            style={{
              top: targetRect.top,
              left: 0,
              width: targetRect.left,
              height: targetRect.height,
              pointerEvents: 'auto',
            }}
            onClick={() => handleFinish(true)}
          />
          {/* 右侧遮罩 */}
          <div
            className="absolute bg-black/60"
            style={{
              top: targetRect.top,
              left: targetRect.left + targetRect.width,
              right: 0,
              height: targetRect.height,
              pointerEvents: 'auto',
            }}
            onClick={() => handleFinish(true)}
          />
          {/* 高亮边框发光环 */}
          <div
            className="absolute rounded-xl"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              boxShadow: '0 0 0 2px rgba(99,179,237,0.9), 0 0 20px 4px rgba(99,179,237,0.35)',
              transition: 'all 0.3s ease',
            }}
          />
        </>
      ) : (
        /* 全屏半透明遮罩（居中步骤）*/
        <div
          className="absolute inset-0 bg-black/65"
          style={{ pointerEvents: 'auto' }}
          onClick={() => handleFinish(true)}
        />
      )}

      {/* ===== 气泡卡片 ===== */}
      <div
        ref={bubbleRef}
        style={{
          position: 'absolute',
          top: bubblePos.top,
          left: bubblePos.left,
          width: 320,
          pointerEvents: 'auto',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          zIndex: 9999,
        }}
      >
        {/* 箭头 */}
        {bubblePos.arrowDir === 'top' && (
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: -8,
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: `8px solid ${isDark ? '#1e1e2e' : '#ffffff'}`,
              filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.15))',
            }}
          />
        )}
        {bubblePos.arrowDir === 'bottom' && (
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: -8,
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: `8px solid ${isDark ? '#1e1e2e' : '#ffffff'}`,
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.15))',
            }}
          />
        )}
        {bubblePos.arrowDir === 'left' && (
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{
              left: -8,
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderRight: `8px solid ${isDark ? '#1e1e2e' : '#ffffff'}`,
            }}
          />
        )}
        {bubblePos.arrowDir === 'right' && (
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{
              right: -8,
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: `8px solid ${isDark ? '#1e1e2e' : '#ffffff'}`,
            }}
          />
        )}

        {/* 卡片主体 */}
        <div
          className={`rounded-2xl shadow-2xl border overflow-hidden ${
            isDark
              ? 'bg-[#1e1e2e] border-white/10'
              : 'bg-white border-gray-200'
          }`}
        >
          {/* 顶部渐变条 */}
          <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600" />

          <div className="p-5">
            {/* 步骤指示器 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setStep(i)}
                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                    className={`rounded-full transition-all duration-300 ${
                      i === step
                        ? isDark
                          ? 'w-5 h-2 bg-gradient-to-r from-cyan-400 to-blue-500'
                          : 'w-5 h-2 bg-gradient-to-r from-gray-600 to-gray-800'
                        : i < step
                        ? isDark
                          ? 'w-2 h-2 bg-blue-400/60'
                          : 'w-2 h-2 bg-gray-500/60'
                        : isDark
                        ? 'w-2 h-2 bg-white/15'
                        : 'w-2 h-2 bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span
                className={`text-xs font-mono ${isDark ? 'text-white/30' : 'text-gray-400'}`}
              >
                {step + 1} / {TOUR_STEPS.length}
              </span>
            </div>

            {/* 标题 */}
            <h3
              className={`text-base font-semibold mb-2 leading-snug ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {l(current.title)}
            </h3>

            {/* 描述 */}
            <p
              className={`text-sm leading-relaxed mb-4 ${
                isDark ? 'text-white/60' : 'text-gray-600'
              }`}
            >
              {l(current.desc)}
            </p>

            {/* 最后一步：「下次不再显示」勾选 */}
            {isLast && (
              <label
                className={`flex items-center gap-2 mb-4 cursor-pointer select-none group`}
                onClick={() => setDontShowAgain(v => !v)}
              >
                {/* 自定义复选框 */}
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all border ${
                    dontShowAgain
                      ? isDark
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-gray-800 border-gray-800'
                      : isDark
                        ? 'border-white/25 bg-white/5 group-hover:border-white/40'
                        : 'border-gray-300 bg-white group-hover:border-gray-400'
                  }`}
                >
                  {dontShowAgain && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={`text-xs ${
                  isDark ? 'text-white/45 group-hover:text-white/65' : 'text-gray-500 group-hover:text-gray-700'
                } transition-colors`}>
                  {lang === 'zh' ? '下次启动不再显示' : "Don't show on next launch"}
                </span>
              </label>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center justify-between">
              {/* 跳过 */}
              <button
                onClick={() => handleFinish(true)}
                className={`text-xs transition-colors ${
                  isDark
                    ? 'text-white/30 hover:text-white/60'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {lang === 'zh' ? '跳过引导' : 'Skip'}
              </button>

              <div className="flex items-center gap-2">
                {/* 上一步 */}
                {!isFirst && (
                  <button
                    onClick={goPrev}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      isDark
                        ? 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                  >
                    {lang === 'zh' ? '上一步' : 'Back'}
                  </button>
                )}

                {/* 下一步 / 完成 */}
                <button
                  onClick={goNext}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all active:scale-95 shadow-lg ${
                    isDark
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-blue-500/25'
                      : 'bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 shadow-gray-700/25'
                  }`}
                >
                  {isLast
                    ? lang === 'zh' ? '开始使用 🚀' : 'Get Started 🚀'
                    : lang === 'zh' ? '下一步' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
