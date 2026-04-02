import { useState, useRef, useEffect, ReactNode } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
  placement?: 'top' | 'bottom';
  theme?: 'dark' | 'light';
}

export default function Tooltip({ text, children, placement = 'bottom', theme = 'dark' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tip = tooltipRef.current.getBoundingClientRect();
    const gap = 8;

    let x = rect.left + rect.width / 2 - tip.width / 2;
    let y = placement === 'top'
      ? rect.top - tip.height - gap
      : rect.bottom + gap;

    // 防止超出视口左右
    if (x < 8) x = 8;
    if (x + tip.width > window.innerWidth - 8) x = window.innerWidth - tip.width - 8;

    setPos({ x, y });
  }, [visible, placement]);

  const arrowColor = theme === 'dark' ? '#2a2a38' : '#ffffff';

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div
          ref={tooltipRef}
          className={`fixed z-[9999] px-2.5 py-1.5 text-[11px] font-medium rounded-md whitespace-nowrap pointer-events-none
            transition-opacity duration-150 animate-fadeIn
            ${theme === 'dark'
              ? 'bg-[#2a2a38] text-white/90 border border-white/10 shadow-xl shadow-black/30'
              : 'bg-white text-gray-700 border border-gray-200 shadow-lg shadow-black/10'
            }`}
          style={{ left: pos.x, top: pos.y }}
        >
          {text}
          {/* 小三角 */}
          <span
            className={`absolute w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent
              ${placement === 'bottom' ? 'border-t-[6px] -top-1.5' : 'border-b-[6px] -bottom-1.5'}
            `}
            style={{
              borderTopColor: placement === 'bottom' ? arrowColor : 'transparent',
              borderBottomColor: placement === 'top' ? arrowColor : 'transparent',
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          />
        </div>
      )}
    </div>
  );
}