import { colors } from '../../styles/theme';

interface GeneratingSpinnerProps {
  message?: string;
  subtitle?: string;
}

export default function GeneratingSpinner({
  message = 'Generating your creature...',
  subtitle = 'Designing stats, moves & sprite',
}: GeneratingSpinnerProps) {
  return (
    <div>
      <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 20px' }}>
        <div style={{
          position: 'absolute', inset: 0,
          border: `3px solid ${colors.panelBorder}`,
          borderTop: `3px solid ${colors.accent}`,
          borderRight: `3px solid ${colors.accent}`,
          borderRadius: '50%',
          animation: 'spin 1.5s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 16,
          border: `2px solid ${colors.panelBorder}`,
          borderBottom: `2px solid #ff6b6b`,
          borderLeft: `2px solid #ff6b6b`,
          borderRadius: '50%',
          animation: 'spin-reverse 1s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 36,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.accent}, #1a1a2e)`,
          animation: 'pulse 1.2s ease-in-out infinite',
          boxShadow: `0 0 20px ${colors.accent}40`,
        }} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 6, height: 6,
            borderRadius: '50%',
            background: ['#ff6b6b', colors.accent, '#4ecdc4', '#ffe66d', '#a855f7', '#3b82f6'][i],
            left: '50%', top: '50%',
            animation: `orbit 2s linear infinite`,
            animationDelay: `${i * -0.33}s`,
            transformOrigin: '0 0',
          }} />
        ))}
      </div>
      <p style={{ fontSize: 16, marginBottom: 4 }}>{message}</p>
      <p style={{ fontSize: 12, color: colors.textDim, margin: 0 }}>{subtitle}</p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spin-reverse { to { transform: rotate(-360deg); } }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(50px) scale(1); opacity: 0.8; }
          50% { transform: rotate(180deg) translateX(50px) scale(1.5); opacity: 1; }
          100% { transform: rotate(360deg) translateX(50px) scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
