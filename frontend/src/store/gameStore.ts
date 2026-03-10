import { create } from 'zustand';
import type {
  Screen,
  BattlePhase,
  CreatureData,
  BattleEvent,
  GameConfig,
  Stats,
  PokedexEntry,
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
  pendingCreature1State: CreatureData | null;
  pendingCreature2State: CreatureData | null;
  winner: number | null;

  // Pokedex creature IDs for win tracking
  player1PokedexId: string | null;
  player2PokedexId: string | null;

  // Pokedex selection mode: which player triggered pokedex from creation
  pokedexReturnTo: Screen | null;

  // Actions
  loadConfig: () => Promise<void>;
  setScreen: (screen: Screen) => void;
  startNewGame: () => void;
  openPokedex: (returnTo?: Screen) => void;
  selectFromPokedex: (entry: PokedexEntry) => void;
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
  applyDamageToCreature: (target: 1 | 2, damage: number) => void;
  applyStatusToCreature: (target: 1 | 2, status: string) => void;
  applyPendingCreatureStates: () => void;
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
  pendingCreature1State: null,
  pendingCreature2State: null,
  winner: null,
  player1PokedexId: null,
  player2PokedexId: null,
  pokedexReturnTo: null,

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

  openPokedex: (returnTo) =>
    set({
      currentScreen: 'pokedex',
      pokedexReturnTo: returnTo ?? null,
    }),

  selectFromPokedex: (entry) => {
    const { currentPlayer, pokedexReturnTo } = get();
    const { id, created_at, wins, evolution_threshold, evolved, losses, ...creature } = entry;
    if (currentPlayer === 1) {
      set({
        player1Creature: creature,
        player1PokedexId: id,
        currentPlayer: 2,
        currentScreen: 'creation',
        pokedexReturnTo: null,
      });
    } else {
      set({
        player2Creature: creature,
        player2PokedexId: id,
        pokedexReturnTo: null,
      });
      // Both creatures ready — trigger battle creation
      get().createBattle();
    }
  },

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
        player1PokedexId: creature.pokedex_id,
        currentPlayer: 2,
      });
    } else {
      set({
        player2Creature: creature,
        player2PokedexId: creature.pokedex_id,
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
      pendingCreature1State: result.creature1,
      pendingCreature2State: result.creature2,
      winner: result.winner,
      player1MoveIndex: null,
      player2MoveIndex: null,
    });
  },

  addDisplayedEvent: (event) =>
    set((s) => ({ displayedEvents: [...s.displayedEvents, event] })),

  clearDisplayedEvents: () => set({ displayedEvents: [] }),

  applyDamageToCreature: (target, damage) => {
    const state = get();
    if (target === 1 && state.creature1State) {
      set({
        creature1State: {
          ...state.creature1State,
          current_hp: Math.max(0, state.creature1State.current_hp - damage),
        },
      });
    } else if (target === 2 && state.creature2State) {
      set({
        creature2State: {
          ...state.creature2State,
          current_hp: Math.max(0, state.creature2State.current_hp - damage),
        },
      });
    }
  },

  applyStatusToCreature: (target, status) => {
    const state = get();
    if (target === 1 && state.creature1State) {
      set({ creature1State: { ...state.creature1State, status } });
    } else if (target === 2 && state.creature2State) {
      set({ creature2State: { ...state.creature2State, status } });
    }
  },

  applyPendingCreatureStates: () => {
    const { pendingCreature1State, pendingCreature2State } = get();
    set({
      creature1State: pendingCreature1State || get().creature1State,
      creature2State: pendingCreature2State || get().creature2State,
      pendingCreature1State: null,
      pendingCreature2State: null,
    });
  },

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
      pendingCreature1State: null,
      pendingCreature2State: null,
      winner: null,
      player1PokedexId: null,
      player2PokedexId: null,
      pokedexReturnTo: null,
    }),
}));
