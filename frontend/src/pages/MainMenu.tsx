import { useEffect, useRef } from 'react';
import { colors } from '../styles/theme';
import Button from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';

export default function MainMenu() {
  const startNewGame = useGameStore((s) => s.startNewGame);
  const openPokedex = useGameStore((s) => s.openPokedex);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Floating particles background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 3 + 1,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 140, 255, ${p.alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: colors.title,
            textShadow: '0 0 30px rgba(255, 220, 80, 0.3)',
            marginBottom: 8,
            letterSpacing: 2,
          }}
        >
          INFINITE POKEMON
        </h1>
        <p
          style={{
            color: colors.subtitle,
            fontSize: 18,
            marginBottom: 48,
          }}
        >
          Create your creature. Battle your friends.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <Button
            label="New Game"
            onClick={startNewGame}
            color={colors.accent}
            hoverColor={colors.accentHover}
            fontSize={20}
            width={200}
            height={56}
          />
          <Button
            label="Pokedex"
            onClick={() => openPokedex()}
            color={colors.button}
            hoverColor={colors.buttonHover}
            fontSize={18}
            width={200}
            height={48}
          />
        </div>
      </div>
    </div>
  );
}
