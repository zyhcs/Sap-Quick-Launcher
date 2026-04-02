import { useEffect, useRef } from 'react';

interface MeteorCanvasProps {
  theme?: 'dark' | 'light';
}

export default function MeteorCanvas({ theme = 'dark' }: MeteorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const isDark = theme === 'dark';

    // ── 静止星星 ──────────────────────────────
    type StaticStar = {
      x: number; y: number;
      r: number; alpha: number;
      twinkleSpeed: number; twinklePhase: number;
      color: [number, number, number];
    };
    const STAR_COLORS: [number, number, number][] = [
      [255, 255, 255], [200, 220, 255], [255, 240, 200],
      [200, 255, 240], [220, 200, 255], [255, 210, 180],
    ];
    const STAR_COLORS_LIGHT: [number, number, number][] = [
      [60, 80, 200], [80, 120, 240], [60, 60, 180],
      [40, 120, 180], [100, 60, 200], [40, 100, 200],
    ];
    const starColors = isDark ? STAR_COLORS : STAR_COLORS_LIGHT;

    const staticStars: StaticStar[] = Array.from({ length: 160 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() < 0.6 ? Math.random() * 0.8 + 0.3
        : Math.random() < 0.9 ? Math.random() * 1.0 + 1.0
        : Math.random() * 1.2 + 2.0,
      alpha: Math.random() * 0.5 + (isDark ? 0.3 : 0.2),
      twinkleSpeed: Math.random() * 0.025 + 0.008,
      twinklePhase: Math.random() * Math.PI * 2,
      color: starColors[Math.floor(Math.random() * starColors.length)],
    }));

    // ── 流星 ──────────────────────────────────
    const METEOR_COLORS_DARK: [number, number, number, number][] = [
      [255, 255, 255, 1],
      [180, 220, 255, 1],
      [200, 160, 255, 1],
      [255, 230, 120, 1],
      [255, 160, 200, 1],
      [120, 255, 200, 1],
    ];
    const METEOR_COLORS_LIGHT: [number, number, number, number][] = [
      [80, 120, 255, 1],
      [140, 80, 255, 1],
      [40, 160, 220, 1],
    ];
    const meteorColors = isDark ? METEOR_COLORS_DARK : METEOR_COLORS_LIGHT;

    type Meteor = {
      x: number; y: number;         // 头部位置
      vx: number; vy: number;       // 速度
      length: number;               // 拖尾长度
      width: number;                // 宽度
      color: [number, number, number, number];
      alpha: number;
      state: 'entering' | 'active' | 'fading';
      life: number;
      maxLife: number;
      delay: number;                // 还未出场的等待帧
      trail: { x: number; y: number }[];  // 轨迹点
      glowRadius: number;
    };

    const NUM_METEORS = 12;
    const meteors: Meteor[] = [];

    function createMeteor(delayFrames = 0): Meteor {
      const angle = (18 + Math.random() * 25) * Math.PI / 180; // 18~43度
      const speed = 8 + Math.random() * 14;                    // 速度
      const length = 120 + Math.random() * 200;                // 拖尾长
      const color = meteorColors[Math.floor(Math.random() * meteorColors.length)];
      // 出发点：顶部 + 右侧
      const startEdge = Math.random();
      let sx: number, sy: number;
      if (startEdge < 0.7) {
        sx = Math.random() * W * 0.85;
        sy = -20;
      } else {
        sx = W + 20;
        sy = Math.random() * H * 0.4;
      }
      return {
        x: sx, y: sy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length,
        width: 1.5 + Math.random() * 3,
        color,
        alpha: 0,
        state: 'entering',
        life: 0,
        maxLife: Math.floor(length / speed * 1.5 + 60),
        delay: delayFrames,
        trail: [],
        glowRadius: 8 + Math.random() * 14,
      };
    }

    // ── 陨石 ──────────────────────────────────
    type Asteroid = {
      x: number; y: number;
      vx: number; vy: number;
      headSize: number;
      tailLength: number;
      color: [number, number, number];
      glowColor: [number, number, number];
      alpha: number;
      life: number;
      maxLife: number;
      delay: number;
      trail: { x: number; y: number; r: number }[];
      state: 'waiting' | 'entering' | 'active' | 'exploding' | 'fading';
      explodeFrame: number;
    };

    const ASTEROID_COLORS: { head: [number,number,number]; glow: [number,number,number] }[] = [
      { head: [255, 160, 80],  glow: [255, 80, 0]   },
      { head: [255, 220, 80],  glow: [255, 140, 0]  },
      { head: [255, 100, 100], glow: [200, 0, 0]    },
      { head: [255, 140, 200], glow: [200, 0, 120]  },
    ];

    const NUM_ASTEROIDS = 3;
    const asteroids: Asteroid[] = [];

    function createAsteroid(delayFrames = 0): Asteroid {
      const angle = (22 + Math.random() * 22) * Math.PI / 180;
      const speed = 4 + Math.random() * 5;
      const colorPick = ASTEROID_COLORS[Math.floor(Math.random() * ASTEROID_COLORS.length)];
      return {
        x: Math.random() * W * 0.75,
        y: -30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        headSize: 5 + Math.random() * 6,
        tailLength: 200 + Math.random() * 200,
        color: colorPick.head,
        glowColor: colorPick.glow,
        alpha: 0,
        life: 0,
        maxLife: 160 + Math.floor(Math.random() * 80),
        delay: delayFrames,
        trail: [],
        state: 'waiting',
        explodeFrame: 0,
      };
    }

    // 初始化流星
    for (let i = 0; i < NUM_METEORS; i++) {
      meteors.push(createMeteor(Math.floor(i * 35 + Math.random() * 40)));
    }
    // 初始化陨石
    for (let i = 0; i < NUM_ASTEROIDS; i++) {
      asteroids.push(createAsteroid(Math.floor(i * 120 + 60 + Math.random() * 80)));
    }

    let frame = 0;

    function draw() {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // ── 绘制静止星星 ──
      for (const s of staticStars) {
        s.twinklePhase += s.twinkleSpeed;
        const twinkle = 0.5 + 0.5 * Math.sin(s.twinklePhase);
        const a = s.alpha * (0.4 + 0.6 * twinkle);
        const [r, g, b] = s.color;

        if (s.r > 1.5 && isDark) {
          const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
          grad.addColorStop(0, `rgba(255,255,255,${a})`);
          grad.addColorStop(0.5, `rgba(${r},${g},${b},${a * 0.6})`);
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── 绘制普通流星 ──
      for (let i = 0; i < meteors.length; i++) {
        const m = meteors[i];

        if (m.delay > 0) { m.delay--; continue; }

        m.life++;
        m.trail.push({ x: m.x, y: m.y });
        if (m.trail.length > 60) m.trail.shift();

        // 状态机
        const lifeRatio = m.life / m.maxLife;
        if (lifeRatio < 0.1) {
          m.alpha = lifeRatio / 0.1;
          m.state = 'entering';
        } else if (lifeRatio > 0.8) {
          m.alpha = (1 - lifeRatio) / 0.2;
          m.state = 'fading';
        } else {
          m.alpha = 1;
          m.state = 'active';
        }

        m.x += m.vx;
        m.y += m.vy;

        // 绘制拖尾
        if (m.trail.length > 1) {
          const [r, g, b] = m.color;
          const trailLen = Math.min(m.trail.length, Math.floor(m.length / Math.sqrt(m.vx * m.vx + m.vy * m.vy)));

          for (let j = Math.max(0, m.trail.length - trailLen); j < m.trail.length - 1; j++) {
            const t0 = m.trail[j];
            const t1 = m.trail[j + 1];
            const segRatio = (j - (m.trail.length - trailLen)) / trailLen;
            const segAlpha = segRatio * m.alpha;
            const segWidth = m.width * segRatio * 1.2;

            ctx.beginPath();
            ctx.moveTo(t0.x, t0.y);
            ctx.lineTo(t1.x, t1.y);
            ctx.strokeStyle = `rgba(${r},${g},${b},${segAlpha * 0.9})`;
            ctx.lineWidth = segWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        }

        // 绘制头部光晕
        const [r, g, b] = m.color;
        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.glowRadius);
        grad.addColorStop(0, `rgba(255,255,255,${m.alpha})`);
        grad.addColorStop(0.3, `rgba(${r},${g},${b},${m.alpha * 0.8})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // 超出屏幕或生命结束则重置
        if (m.life >= m.maxLife || m.x > W + 200 || m.y > H + 200) {
          meteors[i] = createMeteor(Math.floor(30 + Math.random() * 80));
        }
      }

      // ── 绘制陨石 ──
      for (let i = 0; i < asteroids.length; i++) {
        const a = asteroids[i];

        if (a.delay > 0) { a.delay--; continue; }

        a.life++;

        // 记录轨迹点（陨石头部）
        a.trail.push({ x: a.x, y: a.y, r: a.headSize });
        const maxTrailLen = Math.floor(a.tailLength / Math.sqrt(a.vx * a.vx + a.vy * a.vy));
        if (a.trail.length > maxTrailLen) a.trail.shift();

        const lifeRatio = a.life / a.maxLife;

        // 爆炸阶段
        if (lifeRatio > 0.82 && a.state !== 'exploding' && a.state !== 'fading') {
          a.state = 'exploding';
          a.explodeFrame = 0;
        }

        if (a.state === 'exploding') {
          a.explodeFrame++;
          a.alpha = Math.max(0, 1 - a.explodeFrame / 15);
          if (a.explodeFrame > 15) a.state = 'fading';
        } else if (lifeRatio < 0.08) {
          a.alpha = lifeRatio / 0.08;
          a.state = 'entering';
        } else {
          a.alpha = 1;
          if (a.state !== 'fading') a.state = 'active';
        }

        if (a.state === 'fading') {
          a.alpha = Math.max(0, (1 - lifeRatio) / 0.18);
        }

        a.x += a.vx;
        a.y += a.vy;

        const [hr, hg, hb] = a.color;
        const [gr, gg, gb] = a.glowColor;

        // 绘制宽拖尾（橙红色渐变）
        if (a.trail.length > 2) {
          for (let j = 1; j < a.trail.length; j++) {
            const t0 = a.trail[j - 1];
            const t1 = a.trail[j];
            const segRatio = j / a.trail.length;
            const segAlpha = segRatio * a.alpha * 0.85;
            const segWidth = a.headSize * segRatio * 1.6;

            const seg = ctx.createLinearGradient(t0.x, t0.y, t1.x, t1.y);
            seg.addColorStop(0, `rgba(${gr},${gg},${gb},${segAlpha * 0.4})`);
            seg.addColorStop(1, `rgba(${hr},${hg},${hb},${segAlpha})`);

            ctx.beginPath();
            ctx.moveTo(t0.x, t0.y);
            ctx.lineTo(t1.x, t1.y);
            ctx.strokeStyle = seg;
            ctx.lineWidth = segWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        }

        // 爆炸效果：扩散光晕
        if (a.state === 'exploding') {
          const explodeAlpha = (1 - a.explodeFrame / 15) * 0.9;
          const explodeR = a.headSize * (1 + a.explodeFrame * 3);
          const explodeGrad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, explodeR);
          explodeGrad.addColorStop(0, `rgba(255,255,255,${explodeAlpha})`);
          explodeGrad.addColorStop(0.3, `rgba(${hr},${hg},${hb},${explodeAlpha * 0.8})`);
          explodeGrad.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
          ctx.fillStyle = explodeGrad;
          ctx.beginPath();
          ctx.arc(a.x, a.y, explodeR, 0, Math.PI * 2);
          ctx.fill();
        }

        // 绘制头部
        const headGlowR = a.headSize * 3.5 * (a.state === 'exploding' ? 1 + a.explodeFrame * 0.4 : 1);
        const headGrad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, headGlowR);
        headGrad.addColorStop(0, `rgba(255,255,255,${a.alpha})`);
        headGrad.addColorStop(0.25, `rgba(${hr},${hg},${hb},${a.alpha * 0.9})`);
        headGrad.addColorStop(0.6, `rgba(${gr},${gg},${gb},${a.alpha * 0.5})`);
        headGrad.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(a.x, a.y, headGlowR, 0, Math.PI * 2);
        ctx.fill();

        // 超出屏幕或生命结束则重置
        if (a.life >= a.maxLife || a.x > W + 300 || a.y > H + 300) {
          asteroids[i] = createAsteroid(Math.floor(60 + Math.random() * 120));
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      // 重新分布静止星星
      for (const s of staticStars) {
        s.x = Math.random() * W;
        s.y = Math.random() * H;
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [theme]);

  const isDark = theme === 'dark';
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: isDark
          ? 'linear-gradient(170deg, #04040f 0%, #080818 40%, #060612 70%, #050510 100%)'
          : 'linear-gradient(170deg, #dde8ff 0%, #eaf0ff 40%, #e4eeff 70%, #dde8ff 100%)',
      }}
    />
  );
}
