import { colors } from '../../styles/theme';
import Button from '../ui/Button';

interface TurnGateProps {
  message: string;
  onReady: () => void;
}

export default function TurnGate({ message, onReady }: TurnGateProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}
    >
      <h2 style={{ fontSize: 28, marginBottom: 8 }}>{message}</h2>
      <p style={{ color: colors.textDim, marginBottom: 24 }}>
        (Pass the device to the right player)
      </p>
      <Button
        label="Ready"
        onClick={onReady}
        color={colors.accent}
        hoverColor={colors.accentHover}
        fontSize={20}
        width={200}
        height={52}
      />
    </div>
  );
}
