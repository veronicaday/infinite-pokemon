import { useState } from 'react';
import { colors } from '../../styles/theme';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  color?: string;
  hoverColor?: string;
  textColor?: string;
  fontSize?: number;
  width?: number | string;
  height?: number;
}

export default function Button({
  label,
  onClick,
  disabled = false,
  color = colors.button,
  hoverColor = colors.buttonHover,
  textColor = '#fff',
  fontSize = 16,
  width = 'auto',
  height = 48,
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: disabled
          ? '#2a2a3a'
          : hovered
            ? hoverColor
            : color,
        color: disabled ? '#666' : textColor,
        fontSize,
        fontWeight: 600,
        padding: '0 24px',
        borderRadius: 8,
        border: 'none',
        width,
        height,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s, transform 0.1s',
        transform: hovered && !disabled ? 'translateY(-1px)' : 'none',
      }}
    >
      {label}
    </button>
  );
}
