import { motion } from 'framer-motion';
import { ProgressBar } from './ProgressBar';
import type { Need } from '../../types';

interface Props {
  need: Need;
  onClick: () => void;
  disabled?: boolean;
}

export function NeedCard({ need, onClick, disabled }: Props) {
  const isFull = need.value >= need.maxValue;

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.03, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || isFull}
      className={`card text-left w-full transition-all duration-200 ${
        isFull
          ? 'opacity-70 cursor-default border-2 border-success/30'
          : disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-hover'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{need.emoji}</span>
        <div>
          <div className="font-bold text-body-md text-text">{need.label}</div>
          {isFull && (
            <div className="text-caption text-success font-bold">Заполнено ✓</div>
          )}
        </div>
        {!isFull && (
          <div className="ml-auto">
            <span
              className="text-caption font-black px-3 py-1 rounded-full text-white"
              style={{ background: need.color }}
            >
              Задание!
            </span>
          </div>
        )}
      </div>
      <ProgressBar value={need.value} max={need.maxValue} color={need.color} showValue />
    </motion.button>
  );
}
