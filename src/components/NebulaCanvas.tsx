import { useEffect, useRef } from 'react';

interface NebulaCanvasProps {
  theme?: 'dark' | 'light';
}

export default function NebulaCanvas({ theme = 'dark' }: NebulaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const isDark = theme === 'dark';

    // ── 摄像机 ──────────────────────────────
    const cam = {
      obj: { x: 0, y: 0, z: -800 },
      target: { x: 0, y: 0, z: 0 },
      fov: 500,
    };

    // ── 3D 变换工具 ──────────────────────────
    function rotX(v: {x:number,y:number,z:number}, a: number) {
      const rad = a * Math.PI / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      return { x: v.x, y: v.y * cos - v.z * sin, z: v.y * sin + v.z * cos };
    }
    function rotY(v: {x:number,y:number,z:number}, a: number) {
      const rad = a * Math.PI / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      return { x: v.x * cos + v.z * sin, y: v.y, z: -v.x * sin + v.z * cos };
    }
    function rotZ(v: {x:number,y:number,z:number}, a: number) {
      const rad = a * Math.PI / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos, z: v.z };
    }
    function project(v: {x:number,y:number,z:number}) {
      const dz = v.z - cam.obj.z;
      if (dz <= 0) return null;
      const scale = cam.fov / dz;
      return {
        sx: v.x * scale + W / 2,
        sy: v.y * scale + H / 2,
        scale,
        p: scale * 4,
      };
    }

    // ── 粒子类 ──────────────────────────────
    const COLORS_DARK = [
      [200, 180, 255], [150, 200, 255], [255, 200, 160],
      [180, 255, 220], [255, 160, 200], [120, 220, 255],
    ];
    const COLORS_LIGHT = [
      [80, 100, 220], [60, 160, 255], [180, 80, 255],
      [40, 180, 180], [200, 80, 160], [80, 140, 255],
    ];

    type Particle = {
      pos: {x:number,y:number,z:number};
      rot: {x:number,y:number,z:number};
      rotSpeed: {x:number,y:number,z:number};
      colorIdx: number;
      size: number;
      life: number;
      maxLife: number;
    };

    const particles: Particle[] = [];
    const MAX_PARTICLES = 220;
    const RADIUS = 300;

    function rnd() { return (Math.random() - 0.5) * 2; }
    function spawnParticle(): Particle {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = RADIUS * (0.3 + Math.random() * 0.7);
      const colorArr = isDark ? COLORS_DARK : COLORS_LIGHT;
      return {
        pos: {
          x: r * Math.sin(phi) * Math.cos(theta),
          y: r * Math.sin(phi) * Math.sin(theta),
          z: r * Math.cos(phi),
        },
        rot: { x: rnd() * 180, y: rnd() * 180, z: rnd() * 180 },
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.3,
          y: (Math.random() - 0.5) * 0.3,
          z: (Math.random() - 0.5) * 0.15,
        },
        colorIdx: Math.floor(Math.random() * colorArr.length),
        size: Math.random() * 2.5 + 1,
        life: 0,
        maxLife: 400 + Math.random() * 400,
      };
    }

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = spawnParticle();
      p.life = Math.random() * p.maxLife; // 随机初始生命
      particles.push(p);
    }

    // ── 鼠标交互 ──────────────────────────────
    let mouseX = 0, mouseY = 0;
    let targetRotX = 10, targetRotY = -10;
    let currentRotX = 10, currentRotY = -10;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / W - 0.5) * 2;
      mouseY = (e.clientY / H - 0.5) * 2;
      targetRotY = mouseX * 30;
      targetRotX = -mouseY * 20;
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── 渲染循环 ──────────────────────────────
    const colorArr = isDark ? COLORS_DARK : COLORS_LIGHT;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // 平滑旋转
      currentRotX += (targetRotX - currentRotX) * 0.04;
      currentRotY += (targetRotY - currentRotY) * 0.04;

      // 收集可见粒子
      const visible: { sx: number; sy: number; p: number; alpha: number; colorIdx: number; size: number }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        pt.life++;
        if (pt.life >= pt.maxLife) {
          particles[i] = spawnParticle();
          continue;
        }
        // 旋转粒子自身
        pt.rot.x += pt.rotSpeed.x;
        pt.rot.y += pt.rotSpeed.y;
        pt.rot.z += pt.rotSpeed.z;

        let v = { ...pt.pos };
        v = rotX(v, currentRotX + pt.rot.x * 0.1);
        v = rotY(v, currentRotY + pt.rot.y * 0.1);
        v = rotZ(v, pt.rot.z * 0.05);

        const proj = project(v);
        if (!proj) continue;

        // 生命周期透明度：出生淡入 + 死亡淡出
        const lifeRatio = pt.life / pt.maxLife;
        const alpha = lifeRatio < 0.1
          ? lifeRatio / 0.1
          : lifeRatio > 0.85
            ? (1 - lifeRatio) / 0.15
            : 1.0;

        visible.push({
          sx: proj.sx, sy: proj.sy, p: proj.p,
          alpha: alpha * (isDark ? 0.85 : 0.7),
          colorIdx: pt.colorIdx,
          size: pt.size,
        });
      }

      // 按深度排序（p 越小越远）
      visible.sort((a, b) => a.p - b.p);

      for (const v of visible) {
        const [r, g, b] = colorArr[v.colorIdx % colorArr.length];
        const radius = Math.max(1, v.p * v.size * 0.12);

        const grad = ctx.createRadialGradient(v.sx, v.sy, 0, v.sx, v.sy, radius * 2.5);
        grad.addColorStop(0, `rgba(255,255,255,${v.alpha})`);
        grad.addColorStop(0.4, `rgba(${r},${g},${b},${v.alpha * 0.8})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx.globalCompositeOperation = isDark ? 'lighter' : 'multiply';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(v.sx, v.sy, radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
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
          ? 'radial-gradient(ellipse at center top, #000d4d 0%, #000105 100%)'
          : 'radial-gradient(ellipse at center top, #c8d8ff 0%, #e8eeff 100%)',
      }}
    />
  );
}
