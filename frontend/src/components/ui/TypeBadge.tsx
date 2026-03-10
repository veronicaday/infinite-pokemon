import { typeColors, typeTextColors } from '../../styles/theme';

interface TypeBadgeProps {
  type: string;
  size?: 'sm' | 'md';
  selected?: boolean;
  onClick?: () => void;
}

export default function TypeBadge({
  type,
  size = 'sm',
  selected,
  onClick,
}: TypeBadgeProps) {
  const color = typeColors[type] || '#808080';
  const fontSize = size === 'sm' ? 12 : 14;
  const padding = size === 'sm' ? '2px 8px' : '4px 12px';

  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-block',
        background: selected === false ? '#2a2a3a' : color,
        color: typeTextColors[type] || '#fff',
        fontSize,
        fontWeight: 600,
        padding,
        borderRadius: 4,
        cursor: onClick ? 'pointer' : 'default',
        border: selected ? `2px solid #fff` : '2px solid transparent',
        opacity: selected === false ? 0.4 : 1,
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
    >
      {type}
    </span>
  );
}
