import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { VERB_TO_STATUS, STATUS_PATTERN } from '../constants/statusEffects';
import {
  sfxHit,
  sfxSpecialHit,
  sfxSuperEffective,
  sfxNotEffective,
  sfxMiss,
  sfxFaint,
  sfxVictory,
  sfxStatus,
} from '../audio/soundEngine';

const SPECIAL_MOVE_TYPES = new Set([
  'psychic', 'fire', 'water', 'ice', 'electric',
  'ghost', 'dragon', 'dark', 'fairy', 'cosmic', 'digital',
]);

export interface ActiveAnimation {
  target: number;
  moveType: string;
  key: number;
}

export function useBattleAnimation() {
  const {
    battlePhase,
    setBattlePhase,
    battleEvents,
    addDisplayedEvent,
    applyDamageToCreature,
    applyStatusToCreature,
    applyPendingCreatureStates,
  } = useGameStore();

  const [activeAnim, setActiveAnim] = useState<ActiveAnimation | null>(null);
  const animKeyRef = useRef(0);

  useEffect(() => {
    if (battlePhase !== 'animating') return;
    if (battleEvents.length === 0) return;

    let currentIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    function showNextEvent() {
      if (cancelled) return;
      if (currentIndex >= battleEvents.length) {
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
        const target = event.actor === 1 ? 2 : 1;
        animKeyRef.current++;
        setActiveAnim({ target, moveType: event.move_type, key: animKeyRef.current });
        currentIndex++;
        timeoutId = setTimeout(showNextEvent, 1200);
      } else if (event.event_type === 'damage') {
        const target = event.target as 1 | 2;
        const isStatusTick = event.move_type && event.actor === event.target;

        if (isStatusTick) {
          animKeyRef.current++;
          setActiveAnim({ target, moveType: event.move_type!, key: animKeyRef.current });
        }

        const applyDelay = isStatusTick ? 800 : 0;
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          if (event.damage > 0) {
            const moveType = event.move_type?.toLowerCase();
            if (moveType && SPECIAL_MOVE_TYPES.has(moveType)) sfxSpecialHit();
            else sfxHit();
            applyDamageToCreature(target, event.damage);
          } else {
            sfxMiss();
          }
          if (event.effectiveness && event.effectiveness > 1) {
            setTimeout(() => sfxSuperEffective(), 200);
          } else if (event.effectiveness && event.effectiveness < 1 && event.effectiveness > 0) {
            setTimeout(() => sfxNotEffective(), 200);
          }
          currentIndex++;
          timeoutId = setTimeout(showNextEvent, 800);
        }, applyDelay);
      } else if (event.event_type === 'miss') {
        sfxMiss();
        currentIndex++;
        timeoutId = setTimeout(showNextEvent, 800);
      } else if (event.event_type === 'faint') {
        sfxFaint();
        currentIndex++;
        timeoutId = setTimeout(showNextEvent, 900);
      } else if (event.event_type === 'status') {
        sfxStatus();
        const statusMatch = event.message.match(STATUS_PATTERN);
        if (statusMatch && event.actor) {
          const status = VERB_TO_STATUS[statusMatch[1].toLowerCase()] || statusMatch[1].toLowerCase();
          applyStatusToCreature(event.actor as 1 | 2, status);
        }
        currentIndex++;
        timeoutId = setTimeout(showNextEvent, 900);
      } else {
        currentIndex++;
        timeoutId = setTimeout(showNextEvent, 700);
      }
    }

    showNextEvent();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [battleEvents, battlePhase]);

  return { activeAnim, clearAnim: () => setActiveAnim(null) };
}
