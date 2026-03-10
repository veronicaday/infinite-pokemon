import { useState } from 'react';
import { colors } from '../styles/theme';
import { useGameStore } from '../store/gameStore';
import type { Stats, CreatureData } from '../types/game';
import Button from '../components/ui/Button';
import TypeSelector from '../components/creatures/TypeSelector';
import StatSliders from '../components/creatures/StatSliders';
import CreatureCard from '../components/creatures/CreatureCard';

const DEFAULT_STATS: Stats = {
  hp: 50,
  attack: 50,
  defense: 50,
  sp_attack: 50,
  sp_defense: 50,
  speed: 50,
};

export default function CreationScreen() {
  const {
    currentPlayer,
    isGenerating,
    generationError,
    generateCreature,
    confirmCreature,
    createBattle,
    player1Creature,
  } = useGameStore();

  const [description, setDescription] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Normal']);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [preview, setPreview] = useState<CreatureData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe your creature first!');
      return;
    }
    if (selectedTypes.length === 0) {
      setError('Please select at least one type!');
      return;
    }
    setError(null);
    try {
      const creature = await generateCreature(description, selectedTypes, stats);
      setPreview(creature);
    } catch {
      // Error handled by store
    }
  };

  const handleReady = async () => {
    if (!preview) return;
    confirmCreature(preview);

    if (currentPlayer === 1) {
      // Reset form for player 2
      setDescription('');
      setSelectedTypes(['Normal']);
      setStats(DEFAULT_STATS);
      setPreview(null);
      setError(null);
    } else {
      // Both creatures ready — start battle
      await createBattle();
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', padding: 32, gap: 32 }}>
      {/* Left panel: inputs */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          maxWidth: 520,
        }}
      >
        <h2 style={{ fontSize: 28, margin: 0 }}>
          Player {currentPlayer} — Create Your Creature
        </h2>

        {/* Description */}
        <div>
          <label
            style={{ display: 'block', color: colors.textDim, fontSize: 14, marginBottom: 6 }}
          >
            Describe your creature:
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A crystal dragon that controls sound waves..."
            maxLength={300}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: colors.inputBg,
              border: `2px solid ${colors.inputBorder}`,
              borderRadius: 8,
              color: colors.text,
              fontSize: 15,
              outline: 'none',
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = colors.accent)
            }
            onBlur={(e) =>
              (e.target.style.borderColor = colors.inputBorder)
            }
          />
        </div>

        {/* Type selector */}
        <TypeSelector selected={selectedTypes} onChange={setSelectedTypes} />

        {/* Stat sliders */}
        <StatSliders stats={stats} onChange={setStats} />

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
          <Button
            label={isGenerating ? 'Generating...' : 'Generate with AI'}
            onClick={handleGenerate}
            disabled={isGenerating}
            color={colors.accent}
            hoverColor={colors.accentHover}
            fontSize={16}
            width={200}
          />
          <Button
            label="Ready!"
            onClick={handleReady}
            disabled={!preview}
            fontSize={16}
            width={140}
          />
        </div>

        {/* Error */}
        {(error || generationError) && (
          <p style={{ color: colors.error, fontSize: 14, margin: 0 }}>
            {error || generationError}
          </p>
        )}
      </div>

      {/* Right panel: preview */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {preview ? (
          <CreatureCard creature={preview} size="lg" />
        ) : (
          <div
            style={{
              background: colors.panel,
              border: `2px solid ${colors.panelBorder}`,
              borderRadius: 12,
              padding: 40,
              textAlign: 'center',
              color: colors.textDim,
              width: 340,
            }}
          >
            {isGenerating ? (
              <div>
                <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 20px' }}>
                  {/* Outer ring */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    border: `3px solid ${colors.panelBorder}`,
                    borderTop: `3px solid ${colors.accent}`,
                    borderRight: `3px solid ${colors.accent}`,
                    borderRadius: '50%',
                    animation: 'spin 1.5s linear infinite',
                  }} />
                  {/* Inner ring (counter-rotate) */}
                  <div style={{
                    position: 'absolute', inset: 16,
                    border: `2px solid ${colors.panelBorder}`,
                    borderBottom: `2px solid #ff6b6b`,
                    borderLeft: `2px solid #ff6b6b`,
                    borderRadius: '50%',
                    animation: 'spin-reverse 1s linear infinite',
                  }} />
                  {/* Center orb */}
                  <div style={{
                    position: 'absolute', inset: 36,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${colors.accent}, #1a1a2e)`,
                    animation: 'pulse 1.2s ease-in-out infinite',
                    boxShadow: `0 0 20px ${colors.accent}40`,
                  }} />
                  {/* Floating particles */}
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
                <p style={{ fontSize: 16, marginBottom: 4 }}>Generating your creature...</p>
                <p style={{ fontSize: 12, color: colors.textDim, margin: 0 }}>
                  Designing stats, moves & sprite
                </p>
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
            ) : (
              <p>Your creature will appear here</p>
            )}
          </div>
        )}
      </div>

      {/* Show P1's creature in corner when creating P2 */}
      {currentPlayer === 2 && player1Creature && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            opacity: 0.7,
            transform: 'scale(0.7)',
            transformOrigin: 'bottom right',
            pointerEvents: 'none' as const,
          }}
        >
          <CreatureCard creature={player1Creature} size="sm" />
        </div>
      )}
    </div>
  );
}
