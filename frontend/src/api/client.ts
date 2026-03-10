import type { GameConfig, CreatureData, Stats, BattleEvent, PokedexEntry } from '../types/game';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
  }
  return res.json();
}

export async function getConfig(): Promise<GameConfig> {
  return request<GameConfig>('/config');
}

export async function generateCreature(
  description: string,
  types: string[],
  statPreferences?: Stats
): Promise<CreatureData> {
  return request<CreatureData>('/creatures/generate', {
    method: 'POST',
    body: JSON.stringify({
      description,
      types,
      stat_preferences: statPreferences ?? null,
    }),
  });
}

export interface BattleCreateResponse {
  session_id: string;
  creature1: CreatureData;
  creature2: CreatureData;
}

export async function createBattle(
  creature1: CreatureData,
  creature2: CreatureData
): Promise<BattleCreateResponse> {
  return request<BattleCreateResponse>('/battle/create', {
    method: 'POST',
    body: JSON.stringify({ creature1, creature2 }),
  });
}

export interface TurnResponse {
  events: BattleEvent[];
  creature1: CreatureData;
  creature2: CreatureData;
  winner: number | null;
}

export async function executeTurn(
  sessionId: string,
  move1Index: number,
  move2Index: number
): Promise<TurnResponse> {
  return request<TurnResponse>(`/battle/${sessionId}/turn`, {
    method: 'POST',
    body: JSON.stringify({
      move1_index: move1Index,
      move2_index: move2Index,
    }),
  });
}

// --- Pokedex ---

export async function getPokedex(): Promise<PokedexEntry[]> {
  return request<PokedexEntry[]>('/pokedex');
}

export async function getPokedexEntry(id: string): Promise<PokedexEntry> {
  return request<PokedexEntry>(`/pokedex/${id}`);
}

export async function saveToPokedex(creature: CreatureData): Promise<PokedexEntry> {
  return request<PokedexEntry>('/pokedex', {
    method: 'POST',
    body: JSON.stringify(creature),
  });
}

export async function deleteFromPokedex(id: string): Promise<void> {
  await request<void>(`/pokedex/${id}`, { method: 'DELETE' });
}
