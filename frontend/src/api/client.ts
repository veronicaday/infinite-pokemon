import type { GameConfig, CreatureData, Stats, BattleEvent } from '../types/game';

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
