import { useEffect, useRef } from 'react';

interface StarfieldCanvasProps {
  theme?: 'dark' | 'light';
}

export default function StarfieldCanvas({ theme = 'dark' }: StarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const isDark = theme === 'dark';

    // ── 配置 ──────────────────────────────────
    const NUM_STARS = 380;
    const SPEED_BASE = 1.8;        // 基础飞行速度
    const MAX_DEPTH = 1000;        // 最大深度（Z轴）
    const FOV = 350;

    // 星星颜色池
    const STAR_COLORS_DARK = [
      [255, 255, 255], [200, 220, 255], [180, 200, 255],
      [255, 240, 200], [200, 255, 240], [255, 200, 230],
    ];
    const STAR_COLORS_LIGHT = [
      [60, 80, 200], [80, 120, 240], [100, 60, 200],
      [40, 160, 200], [60, 80, 180], [100, 80, 220],
    ];
    const colors = isDark ? STAR_COLORS_DARK : STAR_COLORS_LIGHT;

    type Star = {
      x: number; y: number; z: number;
      px: number; py: number;   // 上一帧投影坐标（用于拖尾）
      colorIdx: number;
      speed: number;
    };

    function initStar(): Star {
      return {
        x: (Math.random() - 0.5) * W * 2,
        y: (Math.random() - 0.5) * H * 2,
        z: Math.random() * MAX_DEPTH,
        px: 0, py: 0,
        colorIdx: Math.floor(Math.random() * colors.length),
        speed: SPEED_BASE * (0.5 + Math.random()),
      };
    }

    const stars: Star[] = Array.from({ length: NUM_STARS }, () => {
      const s = initStar();
      s.z = Math.random() * MAX_DEPTH; // 随机初始 Z
      return s;
    });

    // 鼠标偏移感
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / W - 0.5) * 0.3;
      mouseY = (e.clientY / H - 0.5) * 0.3;
    };
    window.addEventListener('mousemove', onMouseMove);

    let frame = 0;

    function draw() {
      frame++;

      // 背景：用半透明填充制造运动模糊（拖尾感）
      ctx.fillStyle = isDark
        ? 'rgba(3, 2, 20, 0.25)'
        : 'rgba(230, 236, 255, 0.25)';
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2 + mouseX * 60;
      const cy = H / 2 + mouseY * 60;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // 保存上一帧投影坐标
        const pz = s.z;
        const ppx = (s.x / pz) * FOV + cx;
        const ppy = (s.y / pz) * FOV + cy;

        // 向前推进
        s.z -= s.speed * (1 + frame % 60 === 0 ? 0 : 0); // 匀速
        s.z -= s.speed;

        if (s.z <= 0) {
          Object.assign(s, initStar());
          s.z = MAX_DEPTH;
          continue;
        }

        const sx = (s.x / s.z) * FOV + cx;
        const sy = (s.y / s.z) * FOV + cy;

        // 超出屏幕则重置
        if (sx < -W * 0.1 || sx > W * 1.1 || sy < -H * 0.1 || sy > H * 1.1) {
          Object.assign(s, initStar());
          s.z = MAX_DEPTH;
          continue;
        }

        // 亮度与深度
        const depthRatio = 1 - s.z / MAX_DEPTH;
        const alpha = isDark
          ? depthRatio * 0.95 + 0.05
          : depthRatio * 0.7 + 0.1;
        const size = depthRatio * 2.8 + 0.3;

        const [r, g, b] = colors[s.colorIdx];

        // 只在离得近时画拖尾
        if (pz < MAX_DEPTH * 0.9 && depthRatio > 0.15) {
          const tailLength = depthRatio * 18 + 1;
          const dx = sx - ppx;
          const dy = sy - ppy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0 && dist < tailLength * 3) {
            const nx = dx / dist;
            const ny = dy / dist;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx - nx * tailLength, sy - ny * tailLength);
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.6})`;
            ctx.lineWidth = size * 0.7;
            ctx.stroke();
          }
        }

        // 星星点本体
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 2);
        grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
        grad.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.8})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, size * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('mousemove', onMouseMove);
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
          ? 'linear-gradient(160deg, #010118 0%, #03020f 50%, #010118 100%)'
          : 'linear-gradient(160deg, #d8e4ff 0%, #eaf0ff 50%, #d8e4ff 100%)',
      }}
    />
  );
}
