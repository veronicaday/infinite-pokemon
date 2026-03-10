import { useEffect, useState } from 'react';

interface MoveAnimationProps {
  moveType: string;
  onComplete: () => void;
}

const TYPE_ANIMATIONS: Record<string, {
  particles: Array<{
    color: string;
    shape: 'circle' | 'diamond' | 'star' | 'slash' | 'ring' | 'bolt' | 'drop' | 'leaf';
    count: number;
    size: number;
  }>;
  flash: string;
  duration: number;
}> = {
  Fire: {
    particles: [
      { color: '#ff4400', shape: 'circle', count: 8, size: 18 },
      { color: '#ff8800', shape: 'circle', count: 6, size: 12 },
      { color: '#ffcc00', shape: 'circle', count: 4, size: 8 },
    ],
    flash: 'rgba(255, 100, 0, 0.3)',
    duration: 600,
  },
  Water: {
    particles: [
      { color: '#4488ff', shape: 'drop', count: 8, size: 14 },
      { color: '#66bbff', shape: 'drop', count: 5, size: 10 },
      { color: '#99ddff', shape: 'circle', count: 4, size: 8 },
    ],
    flash: 'rgba(80, 140, 255, 0.3)',
    duration: 600,
  },
  Grass: {
    particles: [
      { color: '#44aa22', shape: 'leaf', count: 7, size: 16 },
      { color: '#66cc44', shape: 'leaf', count: 5, size: 12 },
      { color: '#88ee66', shape: 'circle', count: 3, size: 6 },
    ],
    flash: 'rgba(80, 200, 50, 0.25)',
    duration: 700,
  },
  Electric: {
    particles: [
      { color: '#ffdd00', shape: 'bolt', count: 5, size: 22 },
      { color: '#ffffff', shape: 'bolt', count: 3, size: 16 },
      { color: '#ffee66', shape: 'circle', count: 6, size: 6 },
    ],
    flash: 'rgba(255, 220, 0, 0.5)',
    duration: 400,
  },
  Ice: {
    particles: [
      { color: '#aaeeff', shape: 'diamond', count: 6, size: 16 },
      { color: '#ffffff', shape: 'star', count: 4, size: 12 },
      { color: '#ccf4ff', shape: 'diamond', count: 5, size: 10 },
    ],
    flash: 'rgba(170, 230, 255, 0.4)',
    duration: 600,
  },
  Fighting: {
    particles: [
      { color: '#cc3322', shape: 'star', count: 5, size: 20 },
      { color: '#ff6644', shape: 'circle', count: 4, size: 14 },
      { color: '#ffaa88', shape: 'ring', count: 2, size: 30 },
    ],
    flash: 'rgba(200, 50, 30, 0.35)',
    duration: 400,
  },
  Poison: {
    particles: [
      { color: '#aa44bb', shape: 'circle', count: 8, size: 14 },
      { color: '#cc66dd', shape: 'drop', count: 5, size: 10 },
      { color: '#88cc44', shape: 'circle', count: 4, size: 8 },
    ],
    flash: 'rgba(160, 60, 180, 0.3)',
    duration: 650,
  },
  Ground: {
    particles: [
      { color: '#cc9944', shape: 'diamond', count: 6, size: 18 },
      { color: '#886633', shape: 'diamond', count: 5, size: 14 },
      { color: '#eebb66', shape: 'circle', count: 4, size: 10 },
    ],
    flash: 'rgba(200, 160, 80, 0.3)',
    duration: 550,
  },
  Flying: {
    particles: [
      { color: '#aa88ff', shape: 'slash', count: 4, size: 24 },
      { color: '#ccbbff', shape: 'slash', count: 3, size: 18 },
      { color: '#ffffff', shape: 'circle', count: 5, size: 6 },
    ],
    flash: 'rgba(170, 140, 240, 0.25)',
    duration: 500,
  },
  Psychic: {
    particles: [
      { color: '#ff5588', shape: 'ring', count: 3, size: 30 },
      { color: '#ff88aa', shape: 'star', count: 5, size: 12 },
      { color: '#ffaacc', shape: 'circle', count: 4, size: 8 },
    ],
    flash: 'rgba(255, 80, 140, 0.3)',
    duration: 700,
  },
  Bug: {
    particles: [
      { color: '#aacc22', shape: 'circle', count: 10, size: 8 },
      { color: '#88aa11', shape: 'circle', count: 8, size: 6 },
      { color: '#ccdd44', shape: 'diamond', count: 4, size: 10 },
    ],
    flash: 'rgba(160, 180, 30, 0.25)',
    duration: 500,
  },
  Rock: {
    particles: [
      { color: '#aa8833', shape: 'diamond', count: 5, size: 22 },
      { color: '#887722', shape: 'diamond', count: 4, size: 16 },
      { color: '#ccaa55', shape: 'diamond', count: 3, size: 12 },
    ],
    flash: 'rgba(180, 160, 50, 0.35)',
    duration: 500,
  },
  Ghost: {
    particles: [
      { color: '#7744aa', shape: 'circle', count: 6, size: 16 },
      { color: '#9966cc', shape: 'circle', count: 4, size: 20 },
      { color: '#bb88ee', shape: 'circle', count: 3, size: 10 },
    ],
    flash: 'rgba(100, 60, 160, 0.4)',
    duration: 750,
  },
  Dragon: {
    particles: [
      { color: '#7733ff', shape: 'star', count: 5, size: 18 },
      { color: '#5500cc', shape: 'slash', count: 3, size: 22 },
      { color: '#aa66ff', shape: 'circle', count: 4, size: 10 },
    ],
    flash: 'rgba(110, 50, 255, 0.35)',
    duration: 600,
  },
  Dark: {
    particles: [
      { color: '#443322', shape: 'slash', count: 4, size: 24 },
      { color: '#665544', shape: 'slash', count: 3, size: 18 },
      { color: '#221111', shape: 'circle', count: 5, size: 12 },
    ],
    flash: 'rgba(30, 20, 10, 0.5)',
    duration: 450,
  },
  Steel: {
    particles: [
      { color: '#ccccdd', shape: 'diamond', count: 5, size: 16 },
      { color: '#ffffff', shape: 'star', count: 4, size: 10 },
      { color: '#aaaacc', shape: 'circle', count: 4, size: 8 },
    ],
    flash: 'rgba(200, 200, 220, 0.4)',
    duration: 400,
  },
  Fairy: {
    particles: [
      { color: '#ff88bb', shape: 'star', count: 7, size: 14 },
      { color: '#ffaadd', shape: 'star', count: 5, size: 10 },
      { color: '#ffffff', shape: 'circle', count: 6, size: 6 },
    ],
    flash: 'rgba(255, 150, 200, 0.3)',
    duration: 700,
  },
  Normal: {
    particles: [
      { color: '#ddddcc', shape: 'circle', count: 5, size: 14 },
      { color: '#ffffff', shape: 'star', count: 3, size: 16 },
    ],
    flash: 'rgba(255, 255, 255, 0.4)',
    duration: 350,
  },
  Cosmic: {
    particles: [
      { color: '#8800ff', shape: 'star', count: 6, size: 14 },
      { color: '#ff44ff', shape: 'circle', count: 5, size: 10 },
      { color: '#ffffff', shape: 'star', count: 4, size: 8 },
    ],
    flash: 'rgba(100, 0, 200, 0.35)',
    duration: 700,
  },
  Sound: {
    particles: [
      { color: '#ffaa00', shape: 'ring', count: 4, size: 28 },
      { color: '#ffcc44', shape: 'ring', count: 3, size: 22 },
      { color: '#ffdd88', shape: 'circle', count: 4, size: 6 },
    ],
    flash: 'rgba(255, 170, 0, 0.3)',
    duration: 600,
  },
  Digital: {
    particles: [
      { color: '#00ff88', shape: 'diamond', count: 6, size: 12 },
      { color: '#00cc66', shape: 'diamond', count: 5, size: 8 },
      { color: '#88ffcc', shape: 'circle', count: 4, size: 6 },
    ],
    flash: 'rgba(0, 255, 130, 0.3)',
    duration: 500,
  },
};

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  shape: string;
  size: number;
  delay: number;
}

function generateParticles(moveType: string): Particle[] {
  const config = TYPE_ANIMATIONS[moveType] || TYPE_ANIMATIONS.Normal;
  const particles: Particle[] = [];
  let id = 0;

  for (const group of config.particles) {
    for (let i = 0; i < group.count; i++) {
      const angle = (Math.PI * 2 * i) / group.count + Math.random() * 0.5;
      const speed = 40 + Math.random() * 60;
      particles.push({
        id: id++,
        x: 50 + (Math.random() - 0.5) * 20,
        y: 50 + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: group.color,
        shape: group.shape,
        size: group.size * (0.8 + Math.random() * 0.4),
        delay: Math.random() * 0.15,
      });
    }
  }
  return particles;
}

function renderShape(shape: string, size: number, color: string) {
  switch (shape) {
    case 'diamond':
      return (
        <div style={{
          width: size, height: size,
          background: color,
          transform: 'rotate(45deg)',
          boxShadow: `0 0 ${size}px ${color}`,
        }} />
      );
    case 'star':
      return (
        <div style={{
          width: size, height: size,
          background: color,
          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
          boxShadow: `0 0 ${size}px ${color}`,
        }} />
      );
    case 'slash':
      return (
        <div style={{
          width: size * 2, height: size * 0.3,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          borderRadius: size,
          transform: `rotate(${-30 + Math.random() * 60}deg)`,
          boxShadow: `0 0 ${size}px ${color}`,
        }} />
      );
    case 'ring':
      return (
        <div style={{
          width: size, height: size,
          border: `3px solid ${color}`,
          borderRadius: '50%',
          boxShadow: `0 0 ${size / 2}px ${color}, inset 0 0 ${size / 3}px ${color}40`,
        }} />
      );
    case 'bolt':
      return (
        <div style={{
          width: size * 0.5, height: size,
          background: color,
          clipPath: 'polygon(40% 0%, 100% 0%, 60% 40%, 100% 40%, 20% 100%, 40% 55%, 0% 55%)',
          boxShadow: `0 0 ${size}px ${color}`,
          filter: `drop-shadow(0 0 ${size / 2}px ${color})`,
        }} />
      );
    case 'drop':
      return (
        <div style={{
          width: size, height: size * 1.3,
          background: color,
          borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
          boxShadow: `0 0 ${size}px ${color}`,
        }} />
      );
    case 'leaf':
      return (
        <div style={{
          width: size, height: size * 0.6,
          background: color,
          borderRadius: '50% 0% 50% 0%',
          transform: `rotate(${Math.random() * 360}deg)`,
          boxShadow: `0 0 ${size / 2}px ${color}`,
        }} />
      );
    default: // circle
      return (
        <div style={{
          width: size, height: size,
          background: color,
          borderRadius: '50%',
          boxShadow: `0 0 ${size}px ${color}`,
        }} />
      );
  }
}

export default function MoveAnimation({ moveType, onComplete }: MoveAnimationProps) {
  const [particles] = useState(() => generateParticles(moveType));
  const config = TYPE_ANIMATIONS[moveType] || TYPE_ANIMATIONS.Normal;
  const duration = config.duration;

  useEffect(() => {
    const timer = setTimeout(onComplete, duration + 100);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <>
      <style>{`
        @keyframes move-particle {
          0% {
            transform: translate(0, 0) scale(0);
            opacity: 0;
          }
          15% {
            transform: translate(0, 0) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(var(--vx), var(--vy)) scale(0);
            opacity: 0;
          }
        }
        @keyframes move-flash {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes move-shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-4px, 2px); }
          20% { transform: translate(4px, -2px); }
          30% { transform: translate(-3px, -3px); }
          40% { transform: translate(3px, 3px); }
          50% { transform: translate(-2px, 1px); }
          60% { transform: translate(2px, -1px); }
          70% { transform: translate(-1px, 2px); }
          80% { transform: translate(1px, -2px); }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10,
          animation: `move-shake ${duration}ms ease-out`,
        }}
      >
        {/* Flash overlay */}
        <div
          style={{
            position: 'absolute',
            inset: -10,
            background: `radial-gradient(circle, ${config.flash}, transparent 70%)`,
            borderRadius: '50%',
            animation: `move-flash ${duration}ms ease-out forwards`,
          }}
        />

        {/* Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: 'translate(-50%, -50%)',
              '--vx': `${p.vx}px`,
              '--vy': `${p.vy}px`,
              animation: `move-particle ${duration * 0.8}ms ease-out ${p.delay}s forwards`,
              opacity: 0,
            } as React.CSSProperties}
          >
            {renderShape(p.shape, p.size, p.color)}
          </div>
        ))}
      </div>
    </>
  );
}
