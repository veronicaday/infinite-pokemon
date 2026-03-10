import { useMemo } from 'react';
import type { CreatureData } from '../../types/game';
import { generateSvgSprite } from '../../sprites/SvgSpriteGenerator';

interface CreatureSpriteProps {
  creature: CreatureData;
  size?: number;
}

export default function CreatureSprite({
  creature,
  size = 128,
}: CreatureSpriteProps) {
  const svg = useMemo(
    () => generateSvgSprite(creature, size),
    [creature.name, creature.types.join(','), size]
  );

  return (
    <div
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}
