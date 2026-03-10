import { colors } from '../../styles/theme';
import type { Stats } from '../../types/game';
import { STAT_LABELS } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

const DEFAULT_STAT_BUDGET = 600;
const DEFAULT_MIN_STAT = 20;
const DEFAULT_MAX_STAT = 200;
const STAT_KEYS: (keyof Stats)[] = [
  'hp', 'attack', 'defense', 'sp_attack', 'sp_defense', 'speed',
];

interface StatSlidersProps {
  stats: Stats;
  onChange: (stats: Stats) => void;
}

export default function StatSliders({ stats, onChange }: StatSlidersProps) {
  const config = useGameStore((s) => s.config);
  const STAT_BUDGET = config?.stat_budget ?? DEFAULT_STAT_BUDGET;
  const MIN_STAT = config?.min_stat ?? DEFAULT_MIN_STAT;
  const MAX_STAT = config?.max_stat ?? DEFAULT_MAX_STAT;

  const total = STAT_KEYS.reduce((sum, k) => sum + stats[k], 0);

  const handleChange = (changed: keyof Stats, newValue: number) => {
    const clamped = Math.max(MIN_STAT, Math.min(MAX_STAT, newValue));
    const updated = { ...stats, [changed]: clamped };

    // Enforce budget by redistributing other stats
    let diff = STAT_KEYS.reduce((s, k) => s + updated[k], 0) - STAT_BUDGET;
    const others = STAT_KEYS.filter((k) => k !== changed);

    if (diff > 0) {
      // Over budget — reduce others
      while (diff > 0) {
        const reducible = others.filter((k) => updated[k] > MIN_STAT);
        if (reducible.length === 0) {
          updated[changed] = stats[changed]; // revert
          break;
        }
        const per = Math.max(1, Math.floor(diff / reducible.length));
        for (const k of reducible) {
          if (diff <= 0) break;
          const canReduce = updated[k] - MIN_STAT;
          const reduce = Math.min(per, canReduce, diff);
          updated[k] -= reduce;
          diff -= reduce;
        }
      }
    } else if (diff < 0) {
      // Under budget — increase others
      let surplus = -diff;
      while (surplus > 0) {
        const growable = others.filter((k) => updated[k] < MAX_STAT);
        if (growable.length === 0) break;
        const per = Math.max(1, Math.floor(surplus / growable.length));
        for (const k of growable) {
          if (surplus <= 0) break;
          const canGrow = MAX_STAT - updated[k];
          const grow = Math.min(per, canGrow, surplus);
          updated[k] += grow;
          surplus -= grow;
        }
      }
    }

    onChange(updated);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span style={{ color: colors.textDim, fontSize: 14 }}>
          Allocate Stats:
        </span>
        <span
          style={{
            color: total === STAT_BUDGET ? colors.accent : colors.error,
            fontSize: 14,
          }}
        >
          Budget: {total}/{STAT_BUDGET}
        </span>
      </div>
      {STAT_KEYS.map((key) => (
        <div
          key={key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              width: 50,
              fontSize: 14,
              fontWeight: 600,
              color: colors.text,
              textAlign: 'right',
            }}
          >
            {STAT_LABELS[key]}
          </span>
          <input
            type="range"
            min={MIN_STAT}
            max={MAX_STAT}
            value={stats[key]}
            onChange={(e) => handleChange(key, parseInt(e.target.value))}
            style={{
              flex: 1,
              accentColor: colors.accent,
              height: 6,
            }}
          />
          <span
            style={{
              width: 30,
              fontSize: 14,
              color: colors.textDim,
              textAlign: 'right',
            }}
          >
            {stats[key]}
          </span>
        </div>
      ))}
    </div>
  );
}
