export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  sp_attack: number;
  sp_defense: number;
  speed: number;
}

export interface MoveData {
  name: string;
  type: string;
  category: string;
  power: number;
  accuracy: number;
  effect: string | null;
  effect_chance: number;
}

export interface CreatureData {
  name: string;
  description: string;
  types: string[];
  base_stats: Stats;
  moves: MoveData[];
  current_hp: number;
  max_hp: number;
  status: string | null;
  sprite_svg: string | null;
}

export interface BattleEvent {
  event_type: string;
  actor: number | null;
  message: string;
  damage: number;
  effectiveness: number | null;
  move_type: string | null;
}

export interface TypeInfo {
  name: string;
  color: string;
}

export interface GameConfig {
  stat_budget: number;
  min_stat: number;
  max_stat: number;
  stat_names: string[];
  types: TypeInfo[];
}

export interface PokedexEntry extends CreatureData {
  id: string;
  created_at: string;
}

export type Screen = 'menu' | 'creation' | 'battle' | 'pokedex';
export type BattlePhase =
  | 'vs'
  | 'gate_p1'
  | 'select_p1'
  | 'gate_p2'
  | 'select_p2'
  | 'animating'
  | 'result';

export const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  sp_attack: 'SpATK',
  sp_defense: 'SpDEF',
  speed: 'SPD',
};
