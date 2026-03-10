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
  const svg = useMemo(() => {
    // Use Claude-generated SVG if available, otherwise fall back to procedural
    if (creature.sprite_svg) {
      // Resize the SVG to fit the requested size
      return creature.sprite_svg.replace(
        /<svg/,
        `<svg width="${size}" height="${size}"`
      );
    }
    return generateSvgSprite(creature, size);
  }, [creature.name, creature.types.join(','), creature.sprite_svg, size]);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}
