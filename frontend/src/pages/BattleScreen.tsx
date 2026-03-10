import { useEffect, useRef, useCallback, useState } from 'react';
import { colors } from '../styles/theme';
import { useGameStore } from '../store/gameStore';
import * as api from '../api/client';
import CreatureSprite from '../components/creatures/CreatureSprite';
import TypeBadge from '../components/ui/TypeBadge';
import HealthBar from '../components/battle/HealthBar';
import MoveButton from '../components/battle/MoveButton';
import BattleLog from '../components/battle/BattleLog';
import TurnGate from '../components/battle/TurnGate';
import MoveAnimation from '../components/battle/MoveAnimation';
import VsScreen from '../components/battle/VsScreen';
import Button from '../components/ui/Button';
import GeneratingSpinner from '../components/ui/GeneratingSpinner';
import {
  sfxHit,
  sfxSpecialHit,
  sfxSuperEffective,
  sfxNotEffective,
  sfxMiss,
  sfxFaint,
  sfxVictory,
  sfxEvolve,
  sfxStatus,
} from '../audio/soundEngine';

export default function BattleScreen() {
  const {
    battlePhase,
    setBattlePhase,
    creature1State,
    creature2State,
    selectMove,
    executeTurn,
    battleEvents,
    displayedEvents,
    addDisplayedEvent,
    applyDamageToCreature,
    applyPendingCreatureStates,
    winner,
    resetGame,
    player1Creature,
    player2Creature,
  } = useGameStore();

  const c1 = creature1State || player1Creature;
  const c2 = creature2State || player2Creature;
  const eventIndexRef = useRef(0);

  // Track active move animation: which creature (1 or 2) is being hit, and with what type
  const [activeAnim, setActiveAnim] = useState<{
    target: number;
    moveType: string;
    key: number;
  } | null>(null);
  const animKeyRef = useRef(0);
  const [showForfeit, setShowForfeit] = useState(false);
  const [evolvePrompt, setEvolvePrompt] = useState<{ id: string; name: string } | null>(null);
  const [isEvolving, setIsEvolving] = useState(false);

  // Animate battle events sequentially: animation plays, then HP decreases
  useEffect(() => {
    if (battlePhase !== 'animating') return;
    if (battleEvents.length === 0) return;

    let currentIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    function showNextEvent() {
      if (cancelled) return;
      if (currentIndex >= battleEvents.length) {
        // All events shown — apply final creature states and advance phase
        applyPendingCreatureStates();
        if (useGameStore.getState().winner) {
          sfxVictory();
          setBattlePhase('result');
        } else {
          setBattlePhase('gate_p1');
        }
        return;
      }

      const event = battleEvents[currentIndex];
      addDisplayedEvent(event);

      if (event.event_type === 'move' && event.actor && event.move_type) {
        // It's a move — play animation, then apply damage after it finishes
        const target = event.actor === 1 ? 2 : 1;
        animKeyRef.current++;
        setActiveAnim({ target, moveType: event.move_type, key: animKeyRef.current });

        // Wait for animation to finish, then apply damage
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          if (event.damage > 0) {
            // Play hit sound based on move category
            const moveCategory = event.move_type;
            const isSpecial = ['psychic', 'fire', 'water', 'ice', 'electric', 'ghost', 'dragon', 'dark', 'fairy', 'cosmic', 'digital'].includes(moveCategory);
            if (isSpecial) sfxSpecialHit(); else sfxHit();
            applyDamageToCreature(target as 1 | 2, event.damage);
          } else {
            sfxMiss();
          }
          currentIndex++;
          // Brief pause before next event
          timeoutId = setTimeout(showNextEvent, 500);
        }, 1200);
      } else if (event.event_type === 'effectiveness') {
        if (event.effectiveness && event.effectiveness > 1) {
          sfxSuperEffective();
        } else if (event.effectiveness && event.effectiveness < 1) {
          sfxNotEffective();
        }
        currentIndex++;
        timeoutId = setTimeout(showNextEvent, 900);
      } else if (event.event_type === 'faint') {
        sfxFaint();
        currentIndex++;
        timeoutId = setTimeout(showNextEvent, 900);
      } else if (event.event_type === 'status') {
        sfxStatus();
        currentIndex++;
        timeoutId = setTimeout(showNextEvent, 900);
      } else {
        // Other non-move events — short delay
        currentIndex++;
        timeoutId = setTimeout(showNextEvent, 900);
      }
    }

    showNextEvent();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [battleEvents, battlePhase]);

  // Record win for the winning creature's Pokedex entry
  useEffect(() => {
    if (!winner) return;
    let evolveTimeout: ReturnType<typeof setTimeout>;
    const winnerPokedexId = winner === 1
      ? useGameStore.getState().player1PokedexId
      : useGameStore.getState().player2PokedexId;
    if (winnerPokedexId) {
      api.recordWin(winnerPokedexId).then((updated) => {
        if (!updated.evolved && updated.wins >= updated.evolution_threshold) {
          // Delay so the win screen shows first
          evolveTimeout = setTimeout(() => {
            setEvolvePrompt({ id: updated.id, name: updated.name });
          }, 2500);
        }
      }).catch(console.error);
    }
    // Record loss for the loser
    const loserPokedexId = winner === 1
      ? useGameStore.getState().player2PokedexId
      : useGameStore.getState().player1PokedexId;
    if (loserPokedexId) {
      api.recordLoss(loserPokedexId).catch(console.error);
    }
    return () => clearTimeout(evolveTimeout);
  }, [winner]);

  const handleMoveSelect = useCallback(
    async (moveIndex: number) => {
      if (battlePhase === 'select_p1') {
        selectMove(1, moveIndex);
      } else if (battlePhase === 'select_p2') {
        selectMove(2, moveIndex);
        // Both moves selected — execute turn
        // Need to wait for state update
        setTimeout(() => {
          useGameStore.getState().executeTurn();
        }, 50);
      }
    },
    [battlePhase, selectMove]
  );

  if (!c1 || !c2) return null;

  const currentCreature = battlePhase === 'select_p2' ? c2 : c1;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 24,
        position: 'relative',
      }}
    >
      {/* Exit button */}
      {battlePhase !== 'result' && battlePhase !== 'vs' && (
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 15 }}>
          <Button
            label="Exit"
            onClick={() => setShowForfeit(true)}
            color={colors.button}
            hoverColor={colors.buttonHover}
            fontSize={14}
            width={80}
            height={34}
          />
        </div>
      )}

      {/* Arena: both creatures facing off */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Opponent (P2) — shifted right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
            alignSelf: 'flex-end',
            maxWidth: '80%',
            marginRight: '10%',
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: colors.textDim }}>Player 2</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{c2.name}</div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
              {c2.types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
            {c2.status && (
              <div style={{ color: '#ff6464', fontSize: 13, marginTop: 4 }}>
                {c2.status.toUpperCase()}
              </div>
            )}
            <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
              <HealthBar current={c2.current_hp} max={c2.max_hp} width={220} />
            </div>
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <CreatureSprite creature={c2} size={180} />
            {activeAnim && activeAnim.target === 2 && (
              <MoveAnimation
                key={activeAnim.key}
                moveType={activeAnim.moveType}
                onComplete={() => setActiveAnim(null)}
              />
            )}
          </div>
        </div>

        {/* Player (P1) — shifted left */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 16,
            alignSelf: 'flex-start',
            maxWidth: '80%',
            marginLeft: '10%',
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <CreatureSprite creature={c1} size={220} />
            {activeAnim && activeAnim.target === 1 && (
              <MoveAnimation
                key={activeAnim.key}
                moveType={activeAnim.moveType}
                onComplete={() => setActiveAnim(null)}
              />
            )}
          </div>
          <div>
            <div style={{ fontSize: 12, color: colors.textDim }}>Player 1</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{c1.name}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {c1.types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
            {c1.status && (
              <div style={{ color: '#ff6464', fontSize: 13, marginTop: 4 }}>
                {c1.status.toUpperCase()}
              </div>
            )}
            <div style={{ marginTop: 6 }}>
              <HealthBar current={c1.current_hp} max={c1.max_hp} width={220} />
            </div>
          </div>
        </div>
      </div>

      {/* Battle log */}
      <div style={{ marginTop: 24 }} />
      <BattleLog events={displayedEvents} />

      {/* Move selection */}
      {(battlePhase === 'select_p1' || battlePhase === 'select_p2') && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              textAlign: 'center',
              color: colors.accent,
              fontSize: 16,
              marginBottom: 10,
            }}
          >
            {battlePhase === 'select_p1' ? 'Player 1' : 'Player 2'}: Select a
            move
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              maxWidth: 440,
              margin: '0 auto',
            }}
          >
            {currentCreature.moves.map((move, i) => (
              <MoveButton
                key={move.name}
                move={move}
                onClick={() => handleMoveSelect(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Turn gates */}
      {battlePhase === 'gate_p1' && (
        <TurnGate
          message="Player 1 — Choose your move!"
          onReady={() => setBattlePhase('select_p1')}
        />
      )}
      {battlePhase === 'gate_p2' && (
        <TurnGate
          message="Player 2 — Choose your move!"
          onReady={() => setBattlePhase('select_p2')}
        />
      )}

      {/* VS screen intro */}
      {battlePhase === 'vs' && c1 && c2 && (
        <VsScreen
          creature1={c1}
          creature2={c2}
          onComplete={() => setBattlePhase('gate_p1')}
        />
      )}

      {/* Result overlay */}
      {battlePhase === 'result' && winner && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <h1
            style={{
              fontSize: 48,
              color: colors.title,
              textShadow: '0 0 20px rgba(255, 220, 80, 0.4)',
              marginBottom: 12,
            }}
          >
            Player {winner} Wins!
          </h1>
          <p style={{ fontSize: 22, marginBottom: 32 }}>
            {winner === 1 ? c1.name : c2.name} is victorious!
          </p>
          <Button
            label="Main Menu"
            onClick={resetGame}
            color={colors.accent}
            hoverColor={colors.accentHover}
            fontSize={20}
            width={200}
            height={52}
          />
        </div>
      )}

      {/* Evolution prompt overlay */}
      {evolvePrompt && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 25,
          }}
        >
          <div
            style={{
              background: colors.surface,
              border: '2px solid #f0c040',
              borderRadius: 16,
              padding: 40,
              textAlign: 'center',
              maxWidth: 420,
              boxShadow: '0 0 40px rgba(240, 192, 64, 0.4)',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>&#x2728;</div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#f0c040',
                margin: '0 0 8px',
                textShadow: '0 0 16px rgba(240, 192, 64, 0.5)',
              }}
            >
              {evolvePrompt.name}
            </h2>
            <p style={{ fontSize: 20, color: colors.text, margin: '0 0 24px' }}>
              is ready to evolve!
            </p>
            {isEvolving ? (
              <GeneratingSpinner
                message="Evolving..."
                subtitle="Generating evolved form & sprite"
              />
            ) : (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <Button
                  label="Evolve!"
                  onClick={async () => {
                    setIsEvolving(true);
                    sfxEvolve();
                    try {
                      await api.evolveCreature(evolvePrompt.id);
                      setEvolvePrompt(null);
                    } catch {
                      // Evolution failed, dismiss
                      setEvolvePrompt(null);
                    } finally {
                      setIsEvolving(false);
                    }
                  }}
                  color="#f0c040"
                  hoverColor="#f5d060"
                  textColor="#1a1a2e"
                  fontSize={18}
                  width={160}
                  height={48}
                />
                <Button
                  label="Not Now"
                  onClick={() => setEvolvePrompt(null)}
                  color={colors.button}
                  hoverColor={colors.buttonHover}
                  fontSize={16}
                  width={120}
                  height={48}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forfeit confirmation modal */}
      {showForfeit && (
        <div
          onClick={() => setShowForfeit(false)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30,
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
              maxWidth: 380,
            }}
          >
            <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: colors.text }}>
              Are you sure you want to run away?
            </p>
            <p style={{ fontSize: 14, color: colors.textDim, margin: '0 0 24px' }}>
              The battle will be abandoned.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Button
                label="Keep Fighting"
                onClick={() => setShowForfeit(false)}
                color={colors.accent}
                hoverColor={colors.accentHover}
                fontSize={15}
                width={140}
                height={42}
              />
              <Button
                label="Run Away"
                onClick={resetGame}
                color="#dc3c3c"
                hoverColor="#ff5555"
                fontSize={15}
                width={120}
                height={42}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
