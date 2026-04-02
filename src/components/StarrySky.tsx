import React from 'react';
import './StarrySky.css';

const StarrySky: React.FC = () => {
  // 生成基础星星 - 简化为200颗
  const stars = React.useMemo(() => {
    const colors = [
      '255,255,255', '255,255,255', '200,220,255', '255,245,200',
      '255,200,255', '200,255,255'
    ];
    return Array.from({ length: 200 }, (_, i) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 1.5 + 0.5;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const duration = Math.random() * 3 + 2;
      const delay = Math.random() * 5;
      const opacity = Math.random() * 0.5 + 0.3;
      return { id: i, x, y, size, color, duration, delay, opacity };
    });
  }, []);

  // 亮星 - 简化为15颗
  const brightStars = React.useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const hue = Math.random() * 360;
      return { id: i, x: Math.random() * 100, y: Math.random() * 100, hue };
    });
  }, []);

  // 流星 - 简化为8条
  const shootingStars = React.useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 60 + 20,
      y: Math.random() * 30 + 5,
      delay: i * 4 + Math.random() * 3,
      duration: Math.random() * 1 + 3
    }));
  }, []);

  return (
    <div className="starry-sky">
      {/* 星云 */}
      <div className="nebula-layer">
        <div className="nebula nebula-1" />
        <div className="nebula nebula-2" />
        <div className="nebula nebula-3" />
      </div>

      {/* 银河光带 */}
      <div className="milky-way" />

      {/* 星星层 */}
      <div className="stars-layer">
        {stars.map(star => (
          <div
            key={star.id}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              '--star-color': star.color,
              '--star-opacity': star.opacity,
              '--duration': `${star.duration}s`,
              animationDelay: `${star.delay}s`
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* 亮星层 */}
      <div className="bright-stars-layer">
        {brightStars.map(star => (
          <div
            key={star.id}
            className="bright-star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              '--star-hue': star.hue
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* 流星层 */}
      <div className="shooting-stars-layer">
        {shootingStars.map(star => (
          <div
            key={star.id}
            className="shooting-star-new"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* 底部渐变 */}
      <div className="sky-fade" />
    </div>
  );
};

export default StarrySky;