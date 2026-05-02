import { motion } from 'framer-motion';
import type { Pet } from '../types';

interface Props { pet: Pet }

export function XPBar({ pet }: Props) {
  const pct = (pet.xp / pet.xpToNext) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-caption font-bold text-text">{pet.name}</span>
          <span className="text-caption font-bold text-primary">{pet.xp}/{pet.xpToNext} XP</span>
        </div>
        <div className="h-2.5 bg-primary-light rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}
