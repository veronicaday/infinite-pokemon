import { useMemo, useId } from 'react';
import type { CreatureData } from '../../types/game';
import { generateSvgSprite } from '../../sprites/SvgSpriteGenerator';

interface CreatureSpriteProps {
  creature: CreatureData;
  size?: number;
}

/**
 * Scope all id="..." and url(#...) / href="#..." references in an SVG
 * by adding a unique prefix, preventing collisions when multiple SVGs
 * are on the same page.
 */
function scopeSvgIds(svg: string, prefix: string): string {
  // Find all id="..." declarations
  const ids = new Set<string>();
  svg.replace(/\bid="([^"]+)"/g, (_, id) => {
    ids.add(id);
    return '';
  });

  if (ids.size === 0) return svg;

  let scoped = svg;
  for (const id of ids) {
    const prefixed = `${prefix}_${id}`;
    // Replace id declaration
    scoped = scoped.replaceAll(`id="${id}"`, `id="${prefixed}"`);
    // Replace url(#id) references (in fill, filter, clip-path, etc.)
    scoped = scoped.replaceAll(`url(#${id})`, `url(#${prefixed})`);
    // Replace href="#id" references (in <use>, <textPath>, etc.)
    scoped = scoped.replaceAll(`href="#${id}"`, `href="#${prefixed}"`);
  }

  return scoped;
}

export default function CreatureSprite({
  creature,
  size = 128,
}: CreatureSpriteProps) {
  const reactId = useId();

  const svg = useMemo(() => {
    if (creature.sprite_svg) {
      const resized = creature.sprite_svg.replace(
        /<svg/,
        `<svg width="${size}" height="${size}"`
      );
      return scopeSvgIds(resized, reactId.replace(/:/g, ''));
    }
    return generateSvgSprite(creature, size);
  }, [creature.name, creature.types.join(','), creature.sprite_svg, size, reactId]);

  return (
    <>
      <style>{`
        @keyframes sprite-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
      <div
        dangerouslySetInnerHTML={{ __html: svg }}
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          animation: 'sprite-bounce 2s ease-in-out infinite',
        }}
      />
    </>
  );
}
