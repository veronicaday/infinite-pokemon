import { useState } from 'react';
import { colors, typeColors } from '../styles/theme';
import { useGameStore } from '../store/gameStore';
import type { Stats, CreatureData } from '../types/game';
import Button from '../components/ui/Button';
import TypeSelector from '../components/creatures/TypeSelector';
import StatSliders from '../components/creatures/StatSliders';
import CreatureSprite from '../components/creatures/CreatureSprite';
import TypeBadge from '../components/ui/TypeBadge';
import { STAT_LABELS } from '../types/game';
import CreatureCard from '../components/creatures/CreatureCard';

const DEFAULT_STATS: Stats = {
  hp: 100,
  attack: 100,
  defense: 100,
  sp_attack: 100,
  sp_defense: 100,
  speed: 100,
};

const ALL_TYPES = Object.keys(typeColors);

const RANDOM_CONCEPTS = [
  'A tiny lizard made of living lava rocks',
  'An elegant swan with galaxies swirling in its feathers',
  'A mushroom creature that floats using spore clouds',
  'A clockwork owl with gear-shaped eyes',
  'A wolf made of shifting shadows and red mist',
  'A cheerful slime that mimics anything it eats',
  'A coral golem that grows stronger in water',
  'A moth with wings that display hypnotic patterns',
  'A baby phoenix wrapped in its own embers',
  'A crystal spider that weaves webs of light',
  'A samurai beetle with razor-sharp horn blades',
  'An ancient tortoise carrying a miniature forest on its shell',
  'A fox made of crackling electricity',
  'A jellyfish that drifts through the air trailing stardust',
  'A stone gargoyle that comes to life at night',
  'A serpent formed from intertwined vines and thorns',
  'A playful otter with ice armor and a frozen tail',
  'A dragon hatchling sneezing tiny fireballs',
  'A floating book that summons words as weapons',
  'A cat made of swirling purple smoke',
  'A hermit crab using a skull as its shell',
  'A hummingbird that moves faster than the eye can see',
  'A bear cub made of living honey and bees',
  'A knight made of sentient magnetic metal',
  'A frog that sings devastating sonic blasts',
  'A tree spirit with glowing sap running through its bark',
  'A cybernetic shark with laser fins',
  'A bunny with enormous ears that channel psychic energy',
  'A chameleon that shifts between dimensions',
  'A tiny dragon turtle with a volcano on its back',
];

const STAT_BUDGET = 600;
const MIN_STAT = 20;
const MAX_STAT = 200;

function randomStats(): Stats {
  const keys: (keyof Stats)[] = ['hp', 'attack', 'defense', 'sp_attack', 'sp_defense', 'speed'];
  const stats: Stats = { hp: 50, attack: 50, defense: 50, sp_attack: 50, sp_defense: 50, speed: 50 };

  // Generate random values, then normalize to budget
  const raw = keys.map(() => MIN_STAT + Math.random() * (MAX_STAT - MIN_STAT));
  const rawSum = raw.reduce((a, b) => a + b, 0);

  keys.forEach((key, i) => {
    stats[key] = Math.round((raw[i] / rawSum) * STAT_BUDGET);
  });

  // Clamp and fix rounding
  keys.forEach((key) => {
    stats[key] = Math.max(MIN_STAT, Math.min(MAX_STAT, stats[key]));
  });

  // Adjust to hit exact budget
  let total = keys.reduce((sum, k) => sum + stats[k], 0);
  while (total !== STAT_BUDGET) {
    const idx = Math.floor(Math.random() * keys.length);
    const key = keys[idx];
    if (total < STAT_BUDGET && stats[key] < MAX_STAT) {
      stats[key]++;
      total++;
    } else if (total > STAT_BUDGET && stats[key] > MIN_STAT) {
      stats[key]--;
      total--;
    }
  }

  return stats;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function CreationScreen() {
  const {
    currentPlayer,
    isGenerating,
    generationError,
    generateCreature,
    confirmCreature,
    createBattle,
    player1Creature,
    openPokedex,
  } = useGameStore();

  const [description, setDescription] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [preview, setPreview] = useState<CreatureData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRandom = async () => {
    const concept = RANDOM_CONCEPTS[Math.floor(Math.random() * RANDOM_CONCEPTS.length)];
    const typeCount = Math.random() < 0.5 ? 1 : 2;
    const types = pickRandom(ALL_TYPES, typeCount);
    const randStats = randomStats();

    setDescription(concept);
    setSelectedTypes(types);
    setStats(randStats);
    setPreview(null);
    setError(null);

    // Auto-generate
    try {
      const creature = await generateCreature(concept, types, randStats);
      setPreview(creature);
    } catch {
      // Error handled by store
    }
  };

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
      setSelectedTypes([]);
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

        {/* Description + Random */}
        <div>
          <label style={{ color: colors.textDim, fontSize: 14, display: 'block', marginBottom: 6 }}>
            Describe your creature:
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A crystal dragon that controls sound waves..."
              maxLength={300}
              style={{
                width: '100%',
                padding: '10px 100px 10px 14px',
                background: colors.inputBg,
                border: `2px solid ${colors.inputBorder}`,
                borderRadius: 8,
                color: colors.text,
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = colors.accent)
              }
              onBlur={(e) =>
                (e.target.style.borderColor = colors.inputBorder)
              }
            />
            <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}>
              <Button
                label="Random!"
                onClick={handleRandom}
                disabled={isGenerating}
                color="#a855f7"
                hoverColor="#c084fc"
                fontSize={13}
                width={86}
                height={30}
              />
            </div>
          </div>
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

        {/* Pokedex shortcut */}
        <div style={{ marginTop: 8 }}>
          <Button
            label="Choose from Pokedex"
            onClick={() => openPokedex('creation')}
            color={colors.button}
            hoverColor={colors.buttonHover}
            fontSize={14}
            width={200}
            height={38}
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {preview ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Big bouncing sprite */}
            <CreatureSprite creature={preview} size={300} />

            {/* Name + types */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 28 }}>{preview.name}</h2>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                {preview.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>
              <p style={{ color: colors.textDim, fontSize: 13, marginTop: 8, maxWidth: 360 }}>
                {preview.description}
              </p>
            </div>

            {/* Stats + Moves side by side */}
            <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto',
                gap: '2px 10px',
              }}>
                {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((key) => (
                  <div key={key} style={{ display: 'contents' }}>
                    <span style={{ color: colors.textDim, textAlign: 'right' }}>{STAT_LABELS[key]}</span>
                    <span style={{ fontWeight: 600 }}>{preview.base_stats[key as keyof Stats]}</span>
                  </div>
                ))}
              </div>

              {/* Moves */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {preview.moves.map((move) => (
                  <div key={move.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TypeBadge type={move.type} size="sm" />
                    <span style={{ fontWeight: 500 }}>{move.name}</span>
                    <span style={{ color: colors.textDim, fontSize: 11 }}>
                      {move.power > 0 ? `${move.power}pw` : 'status'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              color: colors.textDim,
            }}
          >
            {isGenerating ? (
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
              <p style={{ fontSize: 16 }}>Your creature will appear here</p>
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
