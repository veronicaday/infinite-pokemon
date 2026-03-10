import { useEffect, useRef, useCallback } from 'react';
import { colors } from '../styles/theme';
import { useGameStore } from '../store/gameStore';
import CreatureSprite from '../components/creatures/CreatureSprite';
import TypeBadge from '../components/ui/TypeBadge';
import HealthBar from '../components/battle/HealthBar';
import MoveButton from '../components/battle/MoveButton';
import BattleLog from '../components/battle/BattleLog';
import TurnGate from '../components/battle/TurnGate';
import Button from '../components/ui/Button';

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
    winner,
    resetGame,
    player1Creature,
    player2Creature,
  } = useGameStore();

  const c1 = creature1State || player1Creature;
  const c2 = creature2State || player2Creature;
  const eventIndexRef = useRef(0);

  // Animate battle events one by one
  useEffect(() => {
    if (battlePhase !== 'animating') return;
    if (battleEvents.length === 0) return;

    eventIndexRef.current = 0;
    const interval = setInterval(() => {
      if (eventIndexRef.current < battleEvents.length) {
        addDisplayedEvent(battleEvents[eventIndexRef.current]);
        eventIndexRef.current++;
      } else {
        clearInterval(interval);
        // After all events shown
        if (winner) {
          setBattlePhase('result');
        } else {
          setBattlePhase('gate_p1');
        }
      }
    }, 800);

    return () => clearInterval(interval);
  }, [battleEvents, battlePhase]);

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
      {/* Top area: opponent (P2) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          gap: 16,
          marginBottom: 12,
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
        <CreatureSprite creature={c2} size={120} />
      </div>

      {/* Middle: sprites in arena */}
      <div style={{ flex: 1 }} />

      {/* Bottom area: player (P1) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 16,
          marginBottom: 12,
        }}
      >
        <CreatureSprite creature={c1} size={160} />
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

      {/* Battle log */}
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
    </div>
  );
}
