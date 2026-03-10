import { create } from 'zustand';
import type {
  Screen,
  BattlePhase,
  CreatureData,
  BattleEvent,
  GameConfig,
  Stats,
} from '../types/game';
import * as api from '../api/client';

interface GameState {
  // Navigation
  currentScreen: Screen;

  // Config (loaded from server)
  config: GameConfig | null;

  // Creation flow
  currentPlayer: 1 | 2;
  player1Creature: CreatureData | null;
  player2Creature: CreatureData | null;
  isGenerating: boolean;
  generationError: string | null;

  // Battle state
  battleSessionId: string | null;
  battlePhase: BattlePhase;
  player1MoveIndex: number | null;
  player2MoveIndex: number | null;
  battleEvents: BattleEvent[];
  displayedEvents: BattleEvent[];
  creature1State: CreatureData | null;
  creature2State: CreatureData | null;
  winner: number | null;

  // Actions
  loadConfig: () => Promise<void>;
  setScreen: (screen: Screen) => void;
  startNewGame: () => void;
  generateCreature: (
    description: string,
    types: string[],
    statPreferences?: Stats
  ) => Promise<CreatureData>;
  confirmCreature: (creature: CreatureData) => void;
  createBattle: () => Promise<void>;
  setBattlePhase: (phase: BattlePhase) => void;
  selectMove: (player: 1 | 2, moveIndex: number) => void;
  executeTurn: () => Promise<void>;
  addDisplayedEvent: (event: BattleEvent) => void;
  clearDisplayedEvents: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentScreen: 'menu',
  config: null,
  currentPlayer: 1,
  player1Creature: null,
  player2Creature: null,
  isGenerating: false,
  generationError: null,
  battleSessionId: null,
  battlePhase: 'gate_p1',
  player1MoveIndex: null,
  player2MoveIndex: null,
  battleEvents: [],
  displayedEvents: [],
  creature1State: null,
  creature2State: null,
  winner: null,

  loadConfig: async () => {
    const config = await api.getConfig();
    set({ config });
  },

  setScreen: (screen) => set({ currentScreen: screen }),

  startNewGame: () =>
    set({
      currentScreen: 'creation',
      currentPlayer: 1,
      player1Creature: null,
      player2Creature: null,
      generationError: null,
    }),

  generateCreature: async (description, types, statPreferences) => {
    set({ isGenerating: true, generationError: null });
    try {
      const creature = await api.generateCreature(
        description,
        types,
        statPreferences
      );
      set({ isGenerating: false });
      return creature;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Generation failed';
      set({ isGenerating: false, generationError: msg });
      throw e;
    }
  },

  confirmCreature: (creature) => {
    const { currentPlayer } = get();
    if (currentPlayer === 1) {
      set({
        player1Creature: creature,
        currentPlayer: 2,
      });
    } else {
      set({
        player2Creature: creature,
      });
    }
  },

  createBattle: async () => {
    const { player1Creature, player2Creature } = get();
    if (!player1Creature || !player2Creature) return;

    const result = await api.createBattle(player1Creature, player2Creature);
    set({
      battleSessionId: result.session_id,
      creature1State: result.creature1,
      creature2State: result.creature2,
      currentScreen: 'battle',
      battlePhase: 'vs',
      winner: null,
      battleEvents: [],
      displayedEvents: [],
    });
  },

  setBattlePhase: (phase) => set({ battlePhase: phase }),

  selectMove: (player, moveIndex) => {
    if (player === 1) {
      set({ player1MoveIndex: moveIndex, battlePhase: 'gate_p2' });
    } else {
      set({ player2MoveIndex: moveIndex });
    }
  },

  executeTurn: async () => {
    const { battleSessionId, player1MoveIndex, player2MoveIndex } = get();
    if (
      !battleSessionId ||
      player1MoveIndex === null ||
      player2MoveIndex === null
    )
      return;

    set({ battlePhase: 'animating', displayedEvents: [] });

    const result = await api.executeTurn(
      battleSessionId,
      player1MoveIndex,
      player2MoveIndex
    );

    set({
      battleEvents: result.events,
      creature1State: result.creature1,
      creature2State: result.creature2,
      winner: result.winner,
      player1MoveIndex: null,
      player2MoveIndex: null,
    });
  },

  addDisplayedEvent: (event) =>
    set((s) => ({ displayedEvents: [...s.displayedEvents, event] })),

  clearDisplayedEvents: () => set({ displayedEvents: [] }),

  resetGame: () =>
    set({
      currentScreen: 'menu',
      currentPlayer: 1,
      player1Creature: null,
      player2Creature: null,
      isGenerating: false,
      generationError: null,
      battleSessionId: null,
      battlePhase: 'vs',
      player1MoveIndex: null,
      player2MoveIndex: null,
      battleEvents: [],
      displayedEvents: [],
      creature1State: null,
      creature2State: null,
      winner: null,
    }),
}));
