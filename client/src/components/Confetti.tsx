import { useEffect, useState } from 'react';

const COLORS = ['#765fde', '#ff6170', '#fbcc3c', '#3aafff', '#74c336', '#ff8811'];

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  shape: 'square' | 'circle' | 'rect';
}

interface Props { active: boolean }

export function Confetti({ active }: Props) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) { setPieces([]); return; }
    const ps: Piece[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      size: 6 + Math.random() * 10,
      shape: (['square', 'circle', 'rect'] as const)[Math.floor(Math.random() * 3)],
    }));
    setPieces(ps);
    const t = setTimeout(() => setPieces([]), 5000);
    return () => clearTimeout(t);
  }, [active]);

  if (!pieces.length) return null;

  return (
    <>
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: p.shape === 'rect' ? p.size * 2 : p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '2px' : '2px',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  );
}
