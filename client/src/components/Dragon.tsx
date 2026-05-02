import { motion } from 'framer-motion';
import type { GameState } from '../types';

interface Props {
  mood: GameState['pet']['mood'];
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

const DINO_BY_LEVEL = [
  '/assets/chars/dino5.png', // 1-2
  '/assets/chars/dino1.png', // 3-4
  '/assets/chars/dino2.png', // 5-6
  '/assets/chars/dino3.png', // 7-8
  '/assets/chars/dino4.png', // 9-10+
];

const SPEECH_BUBBLES: Record<GameState['pet']['mood'], string[]> = {
  happy:   ['Привет! Давай играть! 🌟', 'Я рад тебя видеть! 😊', 'Сегодня отличный день!'],
  excited: ['УРА! Молодец! 🎉', 'Вот это да! Ты супер! ⭐', 'Ещё задание, плиз! 🔥'],
  neutral: ['Немного скучаю...', 'Покорми меня знаниями! 📚', 'Хочу чем-нибудь заняться'],
  sad:     ['Мне грустно... 😢', 'Позаботься обо мне!', 'Хочу играть с тобой...'],
};

const SIZES = { sm: 80, md: 140, lg: 200 };

export function Dragon({ mood, level, size = 'md' }: Props) {
  const imgIndex = Math.min(Math.floor((level - 1) / 2), DINO_BY_LEVEL.length - 1);
  const src = DINO_BY_LEVEL[imgIndex];
  const bubbles = SPEECH_BUBBLES[mood];
  const bubble = bubbles[Math.floor(Date.now() / 10000) % bubbles.length];
  const px = SIZES[size];

  const animation = mood === 'excited'
    ? { y: [0, -16, 0], rotate: [-3, 3, -3, 0] }
    : mood === 'sad'
    ? { y: [0, -4, 0] }
    : { y: [0, -10, 0] };

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {size !== 'sm' && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          key={bubble}
          className="bg-white rounded-card shadow-card px-4 py-2 text-body-sm font-bold text-text max-w-[200px] text-center relative"
        >
          {bubble}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />
        </motion.div>
      )}

      <motion.img
        src={src}
        alt="Дракоша"
        style={{ width: px, height: px }}
        className="object-contain drop-shadow-lg"
        animate={animation}
        transition={{
          duration: mood === 'excited' ? 0.6 : 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {size !== 'sm' && (
        <div className="flex items-center gap-1.5 bg-primary-light rounded-full px-3 py-1">
          <span className="text-caption text-primary font-black">Ур. {level}</span>
          <span className="text-caption">
            {mood === 'excited' ? '🔥' : mood === 'happy' ? '😊' : mood === 'sad' ? '😢' : '😐'}
          </span>
        </div>
      )}
    </div>
  );
}
