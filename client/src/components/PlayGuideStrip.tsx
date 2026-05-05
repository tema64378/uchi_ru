import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Gift, MapPin, Sparkles } from 'lucide-react';

interface StepItem {
  icon: ReactNode;
  title: string;
  text: string;
  accent: string;
  tint: string;
}

interface Props {
  title?: string;
  compact?: boolean;
  className?: string;
}

const STEPS: StepItem[] = [
  {
    icon: <MapPin size={18} strokeWidth={2.6} />,
    title: 'Выбери место',
    text: 'Нажми на станцию на карте.',
    accent: '#765fde',
    tint: '#edeaff',
  },
  {
    icon: <Sparkles size={18} strokeWidth={2.6} />,
    title: 'Сделай задание',
    text: 'Прочитай, нарисуй или подвигайся.',
    accent: '#ff6170',
    tint: '#ffe8ea',
  },
  {
    icon: <Gift size={18} strokeWidth={2.6} />,
    title: 'Забери подарок',
    text: 'После задания тебя ждёт сюрприз.',
    accent: '#f0a000',
    tint: '#fff3c8',
  },
];

export function PlayGuideStrip({ title = 'Как играть', compact = false, className = '' }: Props) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-h4 font-black text-text">{title}</h2>
          <p className="text-body-sm font-semibold text-text-muted">
            Три простых шага, чтобы ребёнок не терялся.
          </p>
        </div>
        <span className="soft-chip bg-white/90 text-text-muted">
          1 → 2 → 3
        </span>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? 'sm:grid-cols-3' : 'lg:grid-cols-3'}`}>
        {STEPS.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="rounded-[24px] border border-white/70 bg-white/96 p-4 shadow-[0_12px_24px_rgba(47,47,69,0.06)]"
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
                style={{ background: step.tint, color: step.accent }}
              >
                {step.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.08em]" style={{ color: step.accent }}>
                  Шаг {index + 1}
                </p>
                <h3 className="text-body-sm font-black text-text">{step.title}</h3>
                <p className="mt-1 text-[13px] font-semibold leading-snug text-text-muted">{step.text}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
