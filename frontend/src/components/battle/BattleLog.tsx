import { useEffect, useRef } from 'react';
import type { BattleEvent } from '../../types/game';
import { colors } from '../../styles/theme';

interface BattleLogProps {
  events: BattleEvent[];
}

export default function BattleLog({ events }: BattleLogProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  return (
    <div
      style={{
        background: colors.panel,
        border: `2px solid ${colors.panelBorder}`,
        borderRadius: 8,
        padding: '10px 14px',
        height: 120,
        overflowY: 'auto',
        fontSize: 14,
      }}
    >
      {events.length === 0 ? (
        <span style={{ color: colors.textDim }}>Battle log...</span>
      ) : (
        events.map((e, i) => (
          <div
            key={i}
            style={{
              color: getEventColor(e),
              marginBottom: 3,
              lineHeight: 1.4,
            }}
          >
            {e.message}
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}

function getEventColor(event: BattleEvent): string {
  if (event.effectiveness && event.effectiveness > 1) return '#ff8844';
  if (event.effectiveness && event.effectiveness < 1 && event.effectiveness > 0) return '#88aacc';
  if (event.effectiveness === 0) return '#cc6666';
  if (event.event_type === 'faint') return '#ff4444';
  if (event.event_type === 'status') return '#ddaa44';
  return colors.text;
}
