import React, { useMemo } from 'react';
import './Particles.css';

interface ParticlesProps {
  theme?: 'dark' | 'light';
}

// 固定随机种子，避免每次重渲染重新生成
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const Particles: React.FC<ParticlesProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  const bgGradient = isDark
    ? 'linear-gradient(170deg, #04040f 0%, #080818 40%, #060612 70%, #050510 100%)'
    : 'linear-gradient(170deg, #dde8ff 0%, #eaf0ff 40%, #e4eeff 70%, #dde8ff 100%)';

  // 普通星星
  const stars = useMemo(() => {
    return Array.from({ length: 130 }, (_, i) => {
      const r = seededRandom(i * 7);
      const r2 = seededRandom(i * 13 + 1);
      const r3 = seededRandom(i * 17 + 2);
      const r4 = seededRandom(i * 23 + 3);
      const r5 = seededRandom(i * 29 + 4);
      const r6 = seededRandom(i * 31 + 5);

      const sizePx = r < 0.55 ? r2 * 0.5 + 0.5
        : r < 0.88 ? r2 * 0.8 + 1.0
        : r2 * 1.1 + 1.9;

      const baseOpacity = isDark
        ? (r < 0.55 ? 0.25 : r < 0.88 ? 0.5 : 0.8)
        : (r < 0.55 ? 0.12 : r < 0.88 ? 0.22 : 0.4);

      const colorRoll = seededRandom(i * 41 + 6);
      const color = isDark
        ? (colorRoll < 0.07 ? '#93c5fd' : colorRoll < 0.12 ? '#c4b5fd' : colorRoll < 0.15 ? '#fde68a' : '#ffffff')
        : '#3b5bdb';

      return {
        id: i,
        x: r3 * 100,
        y: r4 * 100,
        sizePx,
        twinkleDuration: r5 * 4 + 2,
        twinkleDelay: r6 * 10,
        baseOpacity,
        hasGlow: sizePx > 1.9,
        color,
      };
    });
  }, [isDark]);

  // 亮星（带十字光芒）
  const brightStars = useMemo(() => {
    const colors = isDark
      ? ['#ffffff', '#e0f2fe', '#bfdbfe', '#ddd6fe', '#fde68a', '#fbcfe8']
      : ['#3b5bdb', '#2563eb', '#4f46e5'];
    return Array.from({ length: 20 }, (_, i) => {
      const r = seededRandom(i * 53 + 100);
      const r2 = seededRandom(i * 59 + 101);
      const r3 = seededRandom(i * 61 + 102);
      const r4 = seededRandom(i * 67 + 103);
      const r5 = seededRandom(i * 71 + 104);
      return {
        id: i,
        x: r * 100,
        y: r2 * 100,
        size: r3 * 1.8 + 2.5,
        twinkleDuration: r4 * 5 + 3,
        twinkleDelay: r5 * 12,
        color: colors[Math.floor(seededRandom(i * 73 + 105) * colors.length)],
        glowSize: seededRandom(i * 79 + 106) * 8 + 10,
      };
    });
  }, [isDark]);

  // 普通流星（更大、彩色、明显）
  const meteors = useMemo(() => {
    const meteorColors = isDark
      ? [
          { head: '#ffffff', tail: 'rgba(180,210,255,0)' },
          { head: '#a5f3fc', tail: 'rgba(100,220,255,0)' },
          { head: '#c4b5fd', tail: 'rgba(160,120,255,0)' },
          { head: '#fde68a', tail: 'rgba(255,210,80,0)' },
          { head: '#fbcfe8', tail: 'rgba(255,160,200,0)' },
          { head: '#86efac', tail: 'rgba(100,255,160,0)' },
          { head: '#fff',    tail: 'rgba(200,220,255,0)' },
          { head: '#bae6fd', tail: 'rgba(100,200,255,0)' },
        ]
      : [
          { head: '#4f8cff', tail: 'rgba(80,120,255,0)' },
          { head: '#818cf8', tail: 'rgba(120,100,255,0)' },
          { head: '#38bdf8', tail: 'rgba(50,160,230,0)' },
        ];

    return Array.from({ length: 9 }, (_, i) => {
      const r  = seededRandom(i * 83 + 200);
      const r2 = seededRandom(i * 89 + 201);
      const r3 = seededRandom(i * 97 + 202);
      const r4 = seededRandom(i * 101+ 203);
      const r5 = seededRandom(i * 103+ 204);
      const r6 = seededRandom(i * 107+ 205);
      const colorPick = meteorColors[Math.floor(r6 * meteorColors.length)];
      return {
        id: i,
        startX: 10 + r * 75,
        startY: r2 * 35,
        // 长度拉长：120~260px
        length: r3 * 140 + 120,
        // 速度 0.5~1.2s
        duration: r4 * 0.7 + 0.5,
        // 错开出场
        delay: i * 2.8 + r5 * 5,
        interval: r * 10 + 8,
        // 角度 18~38°
        angle: 18 + r2 * 20,
        headColor: colorPick.head,
        tailColor: colorPick.tail,
        // 厚度 2~4px
        thickness: r3 * 2 + 2,
        // 发光强度
        glowIntensity: isDark ? (r4 * 12 + 10) : (r4 * 6 + 5),
      };
    });
  }, [isDark]);

  // 陨石（更大、更慢、带炸裂感）
  const asteroids = useMemo(() => {
    const asteroidColors = isDark
      ? [
          { head: '#ff9944', glow: '#ff6600' },
          { head: '#ffdd44', glow: '#ff9900' },
          { head: '#ff5555', glow: '#ff2200' },
          { head: '#ff88cc', glow: '#ff44aa' },
        ]
      : [
          { head: '#ff7722', glow: '#ff4400' },
          { head: '#ffbb33', glow: '#ff8800' },
        ];

    return Array.from({ length: 3 }, (_, i) => {
      const r  = seededRandom(i * 127 + 300);
      const r2 = seededRandom(i * 131 + 301);
      const r3 = seededRandom(i * 137 + 302);
      const r4 = seededRandom(i * 139 + 303);
      const r5 = seededRandom(i * 149 + 304);
      const colorPick = asteroidColors[Math.floor(r5 * asteroidColors.length)];
      return {
        id: i,
        startX: 5 + r * 80,
        startY: r2 * 20,
        // 超长拖尾：200~380px
        length: r3 * 180 + 200,
        // 较慢：1.0~2.2s
        duration: r4 * 1.2 + 1.0,
        // 大延迟错开
        delay: i * 8 + r * 12 + 4,
        interval: r2 * 18 + 15,
        // 角度 25~45°
        angle: 25 + r3 * 20,
        headColor: colorPick.head,
        glowColor: colorPick.glow,
        // 陨石头部更大：5~9px
        headSize: r4 * 4 + 5,
      };
    });
  }, [isDark]);

  return (
    <div className="particles-container" style={{ background: bgGradient }}>
      {/* 普通星星 */}
      {stars.map(s => (
        <div
          key={`star-${s.id}`}
          className="starlight-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.sizePx}px`,
            height: `${s.sizePx}px`,
            backgroundColor: s.color,
            opacity: s.baseOpacity,
            animationDuration: `${s.twinkleDuration}s`,
            animationDelay: `${s.twinkleDelay}s`,
            boxShadow: s.hasGlow
              ? `0 0 ${s.sizePx * 3}px ${s.sizePx}px ${s.color}55`
              : 'none',
          } as React.CSSProperties}
        />
      ))}

      {/* 亮星 */}
      {brightStars.map(s => (
        <div
          key={`bright-${s.id}`}
          className="starlight-bright"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.color,
            animationDuration: `${s.twinkleDuration}s`,
            animationDelay: `${s.twinkleDelay}s`,
            boxShadow: `0 0 ${s.glowSize}px ${s.glowSize / 2}px ${s.color}90, 0 0 ${s.glowSize * 2.5}px ${s.glowSize}px ${s.color}30`,
          } as React.CSSProperties}
        />
      ))}

      {/* 普通流星（更大更亮彩色） */}
      {meteors.map(m => (
        <div
          key={`meteor-${m.id}`}
          className="starlight-meteor"
          style={{
            left: `${m.startX}%`,
            top: `${m.startY}%`,
            width: `${m.length}px`,
            height: `${m.thickness}px`,
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
            transform: `rotate(${m.angle}deg)`,
            background: `linear-gradient(90deg, ${m.headColor}, ${m.tailColor})`,
            boxShadow: `0 0 ${m.glowIntensity}px ${m.glowIntensity / 2}px ${m.headColor}80`,
            '--meteor-interval': `${m.interval}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* 陨石（大、慢、火焰感） */}
      {asteroids.map(a => (
        <div
          key={`asteroid-${a.id}`}
          className="starlight-asteroid"
          style={{
            left: `${a.startX}%`,
            top: `${a.startY}%`,
            animationDuration: `${a.duration}s`,
            animationDelay: `${a.delay}s`,
            transform: `rotate(${a.angle}deg)`,
            '--asteroid-interval': `${a.interval}s`,
          } as React.CSSProperties}
        >
          {/* 长拖尾 */}
          <div
            className="asteroid-tail"
            style={{
              width: `${a.length}px`,
              background: `linear-gradient(90deg, ${a.headColor}dd, ${a.headColor}66 30%, ${a.glowColor}22 70%, transparent)`,
              boxShadow: `0 0 18px 6px ${a.glowColor}66`,
            }}
          />
          {/* 亮头部 */}
          <div
            className="asteroid-head"
            style={{
              width: `${a.headSize}px`,
              height: `${a.headSize}px`,
              backgroundColor: '#fff',
              boxShadow: `0 0 ${a.headSize * 3}px ${a.headSize * 1.5}px ${a.headColor}, 0 0 ${a.headSize * 6}px ${a.headSize * 3}px ${a.glowColor}88`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default Particles;
