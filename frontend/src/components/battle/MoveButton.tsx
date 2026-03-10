import { useState } from 'react';
import type { MoveData } from '../../types/game';
import { typeColors } from '../../styles/theme';

interface MoveButtonProps {
  move: MoveData;
  onClick: () => void;
}

export default function MoveButton({ move, onClick }: MoveButtonProps) {
  const [hovered, setHovered] = useState(false);
  const color = typeColors[move.type] || '#808080';

  // Darken for button bg
  const bg = hovered ? color : darkenHex(color, 40);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: bg,
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '10px 16px',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s, transform 0.1s',
        transform: hovered ? 'translateY(-1px)' : 'none',
        minWidth: 200,
      }}
    >
      <div>{move.name}</div>
      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
        PWR:{move.power} ACC:{move.accuracy}
        {move.effect && ` [${move.effect} ${move.effect_chance}%]`}
      </div>
    </button>
  );
}

function darkenHex(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `rgb(${r},${g},${b})`;
}
