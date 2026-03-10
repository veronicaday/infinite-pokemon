export const STATUS_EMOJI: Record<string, string> = {
  burn: '🔥',
  freeze: '🧊',
  paralyze: '⚡',
  poison: '🤢',
  sleep: '💤',
  confuse: '💫',
  scared: '👻',
};

export const VERB_TO_STATUS: Record<string, string> = {
  burned: 'burn',
  frozen: 'freeze',
  paralyzed: 'paralyze',
  poisoned: 'poison',
  'put to sleep': 'sleep',
  confused: 'confuse',
  scared: 'scared',
};

export const STATUS_PATTERN = /was (burned|frozen|paralyzed|poisoned|put to sleep|confused|scared)/i;

export const STAT_DISPLAY: Record<string, string> = {
  attack: 'ATK',
  defense: 'DEF',
  sp_attack: 'SpATK',
  sp_defense: 'SpDEF',
  speed: 'SPD',
  hp: 'HP',
};

export function formatEffect(effect: string): string {
  if (effect.startsWith('raise_')) {
    const stat = effect.slice(6);
    return `↑${STAT_DISPLAY[stat] || stat}`;
  }
  if (effect.startsWith('lower_')) {
    const stat = effect.slice(6);
    return `↓${STAT_DISPLAY[stat] || stat}`;
  }
  return effect.charAt(0).toUpperCase() + effect.slice(1);
}
