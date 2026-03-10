import { useEffect, useState } from 'react';
import { colors } from '../../styles/theme';

interface HealthBarProps {
  current: number;
  max: number;
  width?: number;
}

export default function HealthBar({
  current,
  max,
  width = 200,
}: HealthBarProps) {
  const [displayRatio, setDisplayRatio] = useState(current / max);
  const targetRatio = current / max;

  // Smooth animation
  useEffect(() => {
    const step = () => {
      setDisplayRatio((prev) => {
        const diff = targetRatio - prev;
        if (Math.abs(diff) < 0.005) return targetRatio;
        return prev + diff * 0.1;
      });
    };
    const id = setInterval(step, 16);
    return () => clearInterval(id);
  }, [targetRatio]);

  const barColor =
    displayRatio > 0.5
      ? colors.hpGreen
      : displayRatio > 0.2
        ? colors.hpYellow
        : colors.hpRed;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width,
          height: 12,
          background: '#1a1a2a',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid #333',
        }}
      >
        <div
          style={{
            width: `${Math.max(0, displayRatio * 100)}%`,
            height: '100%',
            background: barColor,
            borderRadius: 6,
            transition: 'background 0.3s',
          }}
        />
      </div>
      <span style={{ fontSize: 13, color: colors.textDim, minWidth: 60 }}>
        {current}/{max}
      </span>
    </div>
  );
}
