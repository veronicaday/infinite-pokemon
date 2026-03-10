import type { CreatureData } from '../../types/game';
import { STAT_LABELS } from '../../types/game';
import { colors, typeColors } from '../../styles/theme';
import TypeBadge from '../ui/TypeBadge';
import CreatureSprite from './CreatureSprite';

interface CreatureCardProps {
  creature: CreatureData;
  size?: 'sm' | 'lg';
}

export default function CreatureCard({
  creature,
  size = 'lg',
}: CreatureCardProps) {
  const spriteSize = size === 'lg' ? 140 : 100;

  return (
    <div
      style={{
        background: colors.panel,
        border: `2px solid ${colors.panelBorder}`,
        borderRadius: 12,
        padding: size === 'lg' ? 20 : 14,
        minWidth: size === 'lg' ? 340 : 240,
      }}
    >
      {/* Header: name + sprite */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: size === 'lg' ? 22 : 16 }}>
            {creature.name}
          </h3>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {creature.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
        </div>
        <CreatureSprite creature={creature} size={spriteSize} />
      </div>

      {/* Description */}
      <p
        style={{
          color: colors.textDim,
          fontSize: 13,
          marginTop: 10,
          lineHeight: 1.4,
        }}
      >
        {creature.description.slice(0, 120)}
      </p>

      {/* Stats */}
      {size === 'lg' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '4px 12px',
            marginTop: 12,
            fontSize: 13,
          }}
        >
          {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map(
            (key) => (
              <div key={key} style={{ display: 'flex', gap: 4 }}>
                <span style={{ color: colors.textDim }}>
                  {STAT_LABELS[key]}:
                </span>
                <span style={{ fontWeight: 600 }}>
                  {creature.base_stats[key as keyof typeof creature.base_stats]}
                </span>
              </div>
            )
          )}
        </div>
      )}

      {/* Moves */}
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 6,
            color: colors.textDim,
          }}
        >
          Moves:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {creature.moves.map((move) => (
            <div
              key={move.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
              }}
            >
              <span
                style={{
                  background: typeColors[move.type] || '#808080',
                  color: '#fff',
                  padding: '1px 6px',
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {move.type}
              </span>
              <span style={{ fontWeight: 500 }}>{move.name}</span>
              <span style={{ color: colors.textDim }}>
                PWR:{move.power} ACC:{move.accuracy}
              </span>
              {move.effect && (
                <span style={{ color: colors.accent, fontSize: 11 }}>
                  [{move.effect} {move.effect_chance}%]
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
