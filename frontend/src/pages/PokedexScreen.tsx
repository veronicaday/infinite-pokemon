import { useState, useEffect } from 'react';
import { colors } from '../styles/theme';
import { useGameStore } from '../store/gameStore';
import type { PokedexEntry } from '../types/game';
import { STAT_LABELS } from '../types/game';
import type { Stats } from '../types/game';
import Button from '../components/ui/Button';
import CreatureSprite from '../components/creatures/CreatureSprite';
import TypeBadge from '../components/ui/TypeBadge';
import * as api from '../api/client';

export default function PokedexScreen() {
  const { setScreen, selectFromPokedex, pokedexReturnTo } = useGameStore();
  const [entries, setEntries] = useState<PokedexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PokedexEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<PokedexEntry | null>(null);

  const isSelectionMode = pokedexReturnTo === 'creation';

  useEffect(() => {
    loadPokedex();
  }, []);

  const loadPokedex = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPokedex();
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Pokedex');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (entry: PokedexEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(entry);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    setDeletingId(id);
    try {
      await api.deleteFromPokedex(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCardClick = (entry: PokedexEntry) => {
    setSelectedEntry(entry);
  };

  const [evolving, setEvolving] = useState(false);

  const handlePickForBattle = (entry: PokedexEntry) => {
    selectFromPokedex(entry);
  };

  const handleEvolve = async (entry: PokedexEntry) => {
    setEvolving(true);
    try {
      const evolved = await api.evolveCreature(entry.id);
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? evolved : e)));
      setSelectedEntry(evolved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evolve creature');
    } finally {
      setEvolving(false);
    }
  };

  const handleBack = () => {
    if (pokedexReturnTo) {
      setScreen(pokedexReturnTo);
    } else {
      setScreen('menu');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 32,
        background: colors.bg,
      }}
    >
      <style>{`
        @keyframes evolutionGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(255, 200, 50, 0.4); }
          50% { box-shadow: 0 0 20px rgba(255, 200, 50, 0.8), 0 0 30px rgba(255, 180, 30, 0.4); }
        }
      `}</style>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: colors.title,
              margin: 0,
              textShadow: '0 0 20px rgba(255, 220, 80, 0.3)',
            }}
          >
            POKEDEX
          </h1>
          {isSelectionMode && (
            <p style={{ color: colors.accent, fontSize: 14, margin: '4px 0 0' }}>
              Select a creature for battle
            </p>
          )}
        </div>
        <Button
          label="Back"
          onClick={handleBack}
          color={colors.button}
          hoverColor={colors.buttonHover}
          fontSize={16}
          width={100}
          height={40}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <p style={{ color: colors.textDim, fontSize: 18 }}>Loading Pokedex...</p>
          </div>
        )}

        {error && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <p style={{ color: colors.error, fontSize: 16 }}>{error}</p>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              gap: 16,
            }}
          >
            <p style={{ color: colors.textDim, fontSize: 20, margin: 0 }}>
              Your Pokedex is empty! Create some creatures first.
            </p>
            <Button
              label="Create a Creature"
              onClick={() => setScreen('creation')}
              color={colors.accent}
              hoverColor={colors.accentHover}
              fontSize={16}
              width={200}
            />
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {entries.map((entry) => {
              const isEvolutionReady = !entry.evolved && entry.wins >= entry.evolution_threshold;
              return (
              <div
                key={entry.id}
                onClick={() => handleCardClick(entry)}
                onMouseEnter={() => setHoveredId(entry.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: hoveredId === entry.id ? '#32324a' : colors.panel,
                  border: `2px solid ${
                    isEvolutionReady
                      ? 'rgba(255, 200, 50, 0.7)'
                      : hoveredId === entry.id
                        ? colors.accent
                        : colors.panelBorder
                  }`,
                  borderRadius: 12,
                  padding: 16,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s, transform 0.1s',
                  transform:
                    hoveredId === entry.id
                      ? 'translateY(-2px)'
                      : 'none',
                  animation: isEvolutionReady ? 'evolutionGlow 2s ease-in-out infinite' : 'none',
                }}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteClick(entry, e)}
                  disabled={deletingId === entry.id}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(220, 50, 50, 0.2)',
                    border: '1px solid rgba(220, 50, 50, 0.4)',
                    borderRadius: 6,
                    color: '#dc3c3c',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: deletingId === entry.id ? 'not-allowed' : 'pointer',
                    fontSize: 16,
                    fontWeight: 700,
                    lineHeight: 1,
                    opacity: hoveredId === entry.id ? 1 : 0.5,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {deletingId === entry.id ? '...' : '\u00D7'}
                </button>

                {/* Card content */}
                <div
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Sprite */}
                  <div style={{ flexShrink: 0 }}>
                    <CreatureSprite creature={entry} size={90} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 18,
                        fontWeight: 700,
                        color: colors.text,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        paddingRight: 24,
                      }}
                    >
                      {entry.name}
                    </h3>

                    {/* Types */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      {entry.types.map((t) => (
                        <TypeBadge key={t} type={t} />
                      ))}
                    </div>

                    {/* Stats summary */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, auto)',
                        gap: '2px 10px',
                        marginTop: 10,
                        fontSize: 12,
                      }}
                    >
                      {(
                        Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]
                      ).map((key) => (
                        <div key={key} style={{ display: 'flex', gap: 3 }}>
                          <span style={{ color: colors.textDim }}>
                            {STAT_LABELS[key]}
                          </span>
                          <span style={{ fontWeight: 600, color: colors.text }}>
                            {entry.base_stats[key as keyof Stats]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Wins counter */}
                    <div style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: isEvolutionReady ? '#ffc832' : colors.textDim,
                      fontWeight: isEvolutionReady ? 600 : 400,
                    }}>
                      {entry.evolved ? 'Evolved' : `Wins: ${entry.wins}/${entry.evolution_threshold}`}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: colors.surface,
              border: `2px solid ${colors.panelBorder}`,
              borderRadius: 16,
              padding: 32,
              textAlign: 'center',
              maxWidth: 400,
            }}
          >
            <p style={{ fontSize: 18, margin: '0 0 8px', color: colors.text }}>
              Are you sure you want to delete
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, margin: '0 0 24px', color: colors.title }}>
              {confirmDelete.name}?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Button
                label="Cancel"
                onClick={() => setConfirmDelete(null)}
                color={colors.button}
                hoverColor={colors.buttonHover}
                fontSize={15}
                width={120}
                height={40}
              />
              <Button
                label="Delete"
                onClick={handleDeleteConfirm}
                color="#dc3c3c"
                hoverColor="#ff5555"
                fontSize={15}
                width={120}
                height={40}
              />
            </div>
          </div>
        </div>
      )}

      {/* Creature detail overlay */}
      {selectedEntry && (
        <div
          onClick={() => setSelectedEntry(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: colors.surface,
              border: `2px solid ${colors.panelBorder}`,
              borderRadius: 16,
              padding: 32,
              maxWidth: 500,
              width: '90%',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedEntry(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                color: colors.textDim,
                fontSize: 24,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              {'\u00D7'}
            </button>

            {/* Sprite + name */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <CreatureSprite creature={selectedEntry} size={200} />
              <h2 style={{ margin: 0, fontSize: 28, color: colors.text }}>{selectedEntry.name}</h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {selectedEntry.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>
              <p style={{ color: colors.textDim, fontSize: 13, textAlign: 'center', margin: 0, maxWidth: 360 }}>
                {selectedEntry.description}
              </p>
            </div>

            {/* Stats + Moves */}
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 20 }}>
              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto',
                gap: '4px 12px',
                fontSize: 14,
              }}>
                {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((key) => (
                  <div key={key} style={{ display: 'contents' }}>
                    <span style={{ color: colors.textDim, textAlign: 'right' }}>{STAT_LABELS[key]}</span>
                    <span style={{ fontWeight: 600, color: colors.text }}>
                      {selectedEntry.base_stats[key as keyof Stats]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Moves */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedEntry.moves.map((move) => (
                  <div key={move.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TypeBadge type={move.type} size="sm" />
                    <span style={{ fontWeight: 500, color: colors.text, fontSize: 14 }}>{move.name}</span>
                    <span style={{ color: colors.textDim, fontSize: 12 }}>
                      {move.power > 0 ? `${move.power}pw` : 'status'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Battle record */}
            <div style={{
              display: 'flex',
              gap: 20,
              justifyContent: 'center',
              marginTop: 16,
              fontSize: 14,
            }}>
              <span style={{ color: '#4ecdc4' }}>
                <span style={{ fontWeight: 600 }}>{selectedEntry.wins}</span> W
              </span>
              <span style={{ color: '#ff6b6b' }}>
                <span style={{ fontWeight: 600 }}>{selectedEntry.losses}</span> L
              </span>
              <span style={{ color: colors.textDim }}>
                {selectedEntry.wins + selectedEntry.losses > 0
                  ? `${Math.round((selectedEntry.wins / (selectedEntry.wins + selectedEntry.losses)) * 100)}%`
                  : '—'}
              </span>
              {selectedEntry.evolved && (
                <span style={{ color: '#ffc832', fontWeight: 600 }}>Evolved</span>
              )}
            </div>
            {!selectedEntry.evolved && (
              <div style={{
                textAlign: 'center',
                marginTop: 4,
                fontSize: 12,
                color: !selectedEntry.evolved && selectedEntry.wins >= selectedEntry.evolution_threshold ? '#ffc832' : colors.textDim,
              }}>
                Evolution: {selectedEntry.wins}/{selectedEntry.evolution_threshold}
              </div>
            )}

            {/* Evolution button */}
            {!selectedEntry.evolved && selectedEntry.wins >= selectedEntry.evolution_threshold && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                <Button
                  label={evolving ? 'Evolving...' : 'Ready to Evolve!'}
                  onClick={() => !evolving && handleEvolve(selectedEntry)}
                  color="#d4a017"
                  hoverColor="#f0c040"
                  fontSize={18}
                  width={220}
                  height={48}
                />
              </div>
            )}

            {/* Select for battle button (only in selection mode) */}
            {isSelectionMode && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                <Button
                  label="Select for Battle"
                  onClick={() => handlePickForBattle(selectedEntry)}
                  color={colors.accent}
                  hoverColor={colors.accentHover}
                  fontSize={16}
                  width={200}
                  height={44}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
