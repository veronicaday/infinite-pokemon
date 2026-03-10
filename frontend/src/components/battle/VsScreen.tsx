import { useEffect, useState } from 'react';
import { colors } from '../../styles/theme';
import { typeColors } from '../../styles/theme';
import { sfxVsClash } from '../../audio/soundEngine';
import type { CreatureData } from '../../types/game';
import CreatureSprite from '../creatures/CreatureSprite';
import TypeBadge from '../ui/TypeBadge';

interface VsScreenProps {
  creature1: CreatureData;
  creature2: CreatureData;
  onComplete: () => void;
}

type Phase = 'enter' | 'clash' | 'exit';

export default function VsScreen({ creature1, creature2, onComplete }: VsScreenProps) {
  const [phase, setPhase] = useState<Phase>('enter');

  useEffect(() => {
    const timers = [
      setTimeout(() => { setPhase('clash'); sfxVsClash(); }, 600),
      setTimeout(() => setPhase('exit'), 2400),
      setTimeout(onComplete, 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const c1Color = typeColors[creature1.types[0]] || colors.accent;
  const c2Color = typeColors[creature2.types[0]] || colors.accent;

  return (
    <>
      <style>{`
        @keyframes vs-slide-left {
          0% { transform: translateX(-120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes vs-slide-right {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes vs-exit-left {
          0% { transform: translateX(0) scale(1); opacity: 1; }
          100% { transform: translateX(-60%) scale(0.6); opacity: 0; }
        }
        @keyframes vs-exit-right {
          0% { transform: translateX(0) scale(1); opacity: 1; }
          100% { transform: translateX(60%) scale(0.6); opacity: 0; }
        }
        @keyframes vs-text-pop {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes vs-text-exit {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes vs-flash {
          0% { opacity: 0; }
          50% { opacity: 0.6; }
          100% { opacity: 0; }
        }
        @keyframes vs-spark {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--sx), var(--sy)) scale(0); opacity: 0; }
        }
        @keyframes vs-diagonal {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(0) skewX(-15deg); }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 30,
          overflow: 'hidden',
          background: '#0a0a14',
        }}
      >
        {/* Diagonal background split */}
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: '50%', bottom: 0,
            background: `linear-gradient(135deg, ${c1Color}15, ${c1Color}08)`,
            borderRight: `2px solid ${c1Color}30`,
            transform: 'skewX(-5deg)',
            transformOrigin: 'top',
          }} />
          <div style={{
            position: 'absolute',
            top: 0, left: '50%', right: 0, bottom: 0,
            background: `linear-gradient(225deg, ${c2Color}15, ${c2Color}08)`,
            borderLeft: `2px solid ${c2Color}30`,
            transform: 'skewX(-5deg)',
            transformOrigin: 'top',
          }} />
        </div>

        {/* Content container */}
        <div style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
        }}>
          {/* Player 1 side */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              animation: phase === 'enter' || phase === 'clash'
                ? 'vs-slide-left 0.5s ease-out forwards'
                : 'vs-exit-left 0.7s ease-in forwards',
            }}
          >
            <div style={{
              filter: `drop-shadow(0 0 20px ${c1Color}60)`,
            }}>
              <CreatureSprite creature={creature1} size={200} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: colors.textDim, letterSpacing: 2, textTransform: 'uppercase' }}>
                Player 1
              </div>
              <div style={{
                fontSize: 24, fontWeight: 700, marginTop: 2,
                textShadow: `0 0 10px ${c1Color}60`,
              }}>
                {creature1.name}
              </div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}>
                {creature1.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>
            </div>
          </div>

          {/* VS text */}
          <div style={{
            position: 'relative',
            width: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: colors.title,
                textShadow: `0 0 30px ${colors.title}80, 0 0 60px ${colors.title}40, 0 4px 0 #aa8800`,
                letterSpacing: 4,
                animation: phase === 'clash'
                  ? 'vs-text-pop 0.4s ease-out forwards'
                  : phase === 'exit'
                    ? 'vs-text-exit 0.5s ease-in forwards'
                    : 'none',
                opacity: phase === 'enter' ? 0 : undefined,
              }}
            >
              VS
            </div>

            {/* Spark particles on clash */}
            {phase === 'clash' && (
              <>
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (Math.PI * 2 * i) / 12;
                  const dist = 60 + Math.random() * 40;
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        width: 4, height: 4,
                        borderRadius: '50%',
                        background: i % 2 === 0 ? colors.title : '#fff',
                        boxShadow: `0 0 6px ${colors.title}`,
                        '--sx': `${Math.cos(angle) * dist}px`,
                        '--sy': `${Math.sin(angle) * dist}px`,
                        animation: `vs-spark 0.6s ease-out ${i * 0.03}s forwards`,
                      } as React.CSSProperties}
                    />
                  );
                })}
              </>
            )}
          </div>

          {/* Player 2 side */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              animation: phase === 'enter' || phase === 'clash'
                ? 'vs-slide-right 0.5s ease-out forwards'
                : 'vs-exit-right 0.7s ease-in forwards',
            }}
          >
            <div style={{
              filter: `drop-shadow(0 0 20px ${c2Color}60)`,
            }}>
              <CreatureSprite creature={creature2} size={200} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: colors.textDim, letterSpacing: 2, textTransform: 'uppercase' }}>
                Player 2
              </div>
              <div style={{
                fontSize: 24, fontWeight: 700, marginTop: 2,
                textShadow: `0 0 10px ${c2Color}60`,
              }}>
                {creature2.name}
              </div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}>
                {creature2.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Flash on clash */}
        {phase === 'clash' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle, ${colors.title}40, transparent 70%)`,
            animation: 'vs-flash 0.4s ease-out forwards',
            pointerEvents: 'none',
          }} />
        )}
      </div>
    </>
  );
}
