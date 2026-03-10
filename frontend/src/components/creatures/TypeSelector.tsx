import TypeBadge from '../ui/TypeBadge';

const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
  'Cosmic', 'Sound', 'Digital',
];

interface TypeSelectorProps {
  selected: string[];
  onChange: (types: string[]) => void;
}

export default function TypeSelector({ selected, onChange }: TypeSelectorProps) {
  const toggle = (type: string) => {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else if (selected.length < 2) {
      onChange([...selected, type]);
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span style={{ color: '#a0a0b4', fontSize: 14 }}>
          Select 1-2 types:
        </span>
        <span style={{ color: '#888', fontSize: 12 }}>
          ({selected.length}/2)
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ALL_TYPES.map((type) => (
          <TypeBadge
            key={type}
            type={type}
            size="md"
            selected={selected.includes(type)}
            onClick={() => toggle(type)}
          />
        ))}
      </div>
    </div>
  );
}
