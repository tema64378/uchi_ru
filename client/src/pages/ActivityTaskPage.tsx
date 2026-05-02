import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Play, Sparkles, Timer, Trophy } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { ALL_QUESTS } from '../lib/quests';
import type { NeedType } from '../types';

interface Props {
  onComplete: (questId: string, xpReward: number, needType: string) => void;
}

type Phase = 'ready' | 'running' | 'done';

const MOTIVATIONAL: string[] = [
  'Давай! 💪',
  'Молодец! 🔥',
  'Ещё чуть-чуть! ⚡',
  'Ты справишься! 🚀',
  'Супер! 🌟',
  'Не останавливайся! 🏃',
];

const PIRATE_CHARS = ['/assets/chars/pirate_pink.png', '/assets/chars/pirate_blue.png'];

const RING_RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatTime(secs: number): string {
  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : String(secs);
}

export function ActivityTaskPage({ onComplete }: Props) {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();

  const quest = ALL_QUESTS.find(q => q.id === questId);
  const duration = quest?.duration ?? 60;

  const [phase, setPhase] = useState<Phase>('ready');
  const [timeLeft, setTimeLeft] = useState(duration);
  const [motiveIdx, setMotiveIdx] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [pirateIdx] = useState(() => Math.floor(Math.random() * PIRATE_CHARS.length));

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const motiveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (motiveRef.current) clearInterval(motiveRef.current);
  }, []);

  if (!quest) {
    return (
      <main className="app-page flex min-h-screen items-center justify-center bg-[#fff8e9] px-5">
        <div className="card w-full max-w-sm text-center">
          <p className="text-h4 font-black text-text">Задание не найдено</p>
          <button className="btn-primary mt-4 w-full" onClick={() => navigate('/')}>На главную</button>
        </div>
      </main>
    );
  }

  const activeQuest = quest;

  function finishActivity() {
    setPhase('done');
    setTimeout(() => onComplete(activeQuest.id, activeQuest.xpReward, activeQuest.needType as NeedType), 700);
  }

  function startTimer() {
    setPhase('running');
    setTimeLeft(duration);
    setMotiveIdx(0);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (motiveRef.current) clearInterval(motiveRef.current);
          finishActivity();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const motiveInterval = Math.max(4000, Math.floor((duration * 1000) / MOTIVATIONAL.length));
    motiveRef.current = setInterval(() => {
      setMotiveIdx(prev => (prev + 1) % MOTIVATIONAL.length);
    }, motiveInterval);
  }

  function handleEarlyDone() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (motiveRef.current) clearInterval(motiveRef.current);
    finishActivity();
  }

  const progressRatio = timeLeft / duration;
  const strokeOffset = CIRCUMFERENCE * progressRatio;
  const ringColor =
    progressRatio > 0.4 ? '#fbcc3c' : progressRatio > 0.2 ? '#ff8811' : '#ff6170';
  const timeDisplay = formatTime(timeLeft);

  return (
    <main className="app-page relative overflow-hidden bg-[#fff8e9] text-text">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#fff8e9_0%,#fffdf5_36%,#f5f1ff_100%)]" />

      <div className="page-shell relative z-10 py-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="soft-chip bg-white/90 text-text-muted"
            aria-label="Назад"
          >
            <ChevronLeft size={14} />
            Назад
          </button>
          <span className="soft-chip bg-white/90 text-[#a36a00]">
            <Timer size={14} />
            Движение
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="glass-panel rounded-[36px] p-5 sm:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="min-w-0">
                <div className="map-title-chip w-fit bg-white/90">
                  <Sparkles size={14} />
                  {activeQuest.needType === 'energy' ? 'Поляна движения' : activeQuest.title}
                </div>
                <h1 className="mt-3 font-display text-h2 font-black text-text sm:text-h1">
                  {activeQuest.title}
                </h1>
                <p className="mt-3 max-w-2xl text-body-md font-semibold leading-relaxed text-text-muted">
                  {activeQuest.description}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Время</p>
                    <p className="mt-2 text-h3 font-black text-[#a36a00]">{formatTime(duration)}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">XP</p>
                    <p className="mt-2 text-h3 font-black text-primary">{activeQuest.xpReward}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Режим</p>
                    <p className="mt-2 text-body-sm font-black text-text">
                      {phase === 'running' ? 'В процессе' : phase === 'done' ? 'Готово' : 'Старт'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/70 bg-white/95 p-4 shadow-[0_18px_36px_rgba(47,47,69,0.08)]">
                <div className="overflow-hidden rounded-[24px] border border-white/70 bg-[#fff6d9]">
                  {!imgError && (
                    <img
                      src={PIRATE_CHARS[pirateIdx]}
                      alt="Питомец"
                      className="h-40 w-full object-contain"
                      onError={() => setImgError(true)}
                    />
                  )}
                </div>
                <div className="mt-4 rounded-[24px] bg-[#fff8e9] p-4">
                  <p className="text-body-sm font-semibold text-text-muted">
                    {phase === 'running'
                      ? MOTIVATIONAL[motiveIdx]
                      : 'Сделай движение, чтобы Дракоша получил заряд и опыт.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <AnimatePresence mode="wait">
                {phase === 'ready' && (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]"
                  >
                    <div className="rounded-[30px] border border-white/70 bg-[#fff3c8] p-5 text-center shadow-[0_16px_30px_rgba(47,47,69,0.08)]">
                      <div className="text-caption font-black uppercase tracking-[0.08em] text-[#a36a00]">
                        На старт
                      </div>
                      <div className="mt-2 text-h1 font-black" style={{ color: '#fbcc3c' }}>
                        {formatTime(duration)}
                      </div>
                      <p className="mt-2 text-body-sm font-semibold text-text-muted">
                        Двигайся, пока не закончится таймер.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startTimer}
                      className="btn-primary h-full min-h-[170px] w-full flex-col rounded-[30px] bg-[#fbcc3c] text-h4 text-[#2f2f45] shadow-[0_12px_28px_rgba(251,204,60,0.35)]"
                    >
                      <Play size={22} />
                      Готово, начинаю
                    </button>
                  </motion.div>
                )}

                {phase === 'running' && (
                  <motion.div
                    key="running"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]"
                  >
                    <div className="rounded-[30px] border border-white/70 bg-white/95 p-5 shadow-[0_16px_30px_rgba(47,47,69,0.08)]">
                      <div className="flex items-center justify-center">
                        <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
                          <svg width={220} height={220} aria-hidden="true" className="absolute inset-0">
                            <circle cx={110} cy={110} r={RING_RADIUS} fill="none" stroke="#e5e7eb" strokeWidth={12} />
                            <circle
                              cx={110}
                              cy={110}
                              r={RING_RADIUS}
                              fill="none"
                              stroke={ringColor}
                              strokeWidth={12}
                              strokeLinecap="round"
                              strokeDasharray={CIRCUMFERENCE}
                              strokeDashoffset={strokeOffset}
                              style={{
                                transform: 'rotate(-90deg)',
                                transformOrigin: '110px 110px',
                                transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s ease',
                              }}
                            />
                          </svg>

                          <AnimatePresence mode="wait">
                            <motion.span
                              key={timeLeft}
                              initial={{ scale: 1.2, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.85, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="z-10 font-black"
                              style={{ fontSize: timeDisplay.length > 3 ? '36px' : '54px', color: ringColor }}
                            >
                              {timeDisplay}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                      </div>

                      <p className="mt-5 text-center text-body-md font-black" style={{ color: ringColor }}>
                        {MOTIVATIONAL[motiveIdx]}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="rounded-[28px] border border-white/70 bg-[#fff8e9] p-4">
                        <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">
                          Подсказка
                        </p>
                        <p className="mt-2 text-body-sm font-semibold text-text-muted">
                          Продолжай двигаться без остановки. Это короткий спринт, не марафон.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleEarlyDone}
                        className="btn-brand w-full"
                      >
                        Я уже сделал
                      </button>
                    </div>
                  </motion.div>
                )}

                {phase === 'done' && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]"
                  >
                    <div className="rounded-[30px] border border-success/20 bg-success/10 p-5 shadow-[0_16px_30px_rgba(47,47,69,0.08)]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-success">
                          <Trophy size={28} />
                        </div>
                        <div>
                          <p className="text-caption font-black uppercase tracking-[0.08em] text-success">
                            Отлично
                          </p>
                          <h2 className="font-display text-h3 font-black text-text">Готово!</h2>
                        </div>
                      </div>
                      <p className="mt-4 text-body-md font-semibold text-text-muted">
                        +{activeQuest.xpReward} XP для Дракоши. Возвращайся на карту за следующим заданием.
                      </p>
                    </div>

                    <div className="rounded-[30px] border border-white/70 bg-white/95 p-4 shadow-[0_16px_30px_rgba(47,47,69,0.08)]">
                      <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Следующий шаг</p>
                      <p className="mt-2 text-body-sm font-semibold text-text-muted">
                        Можно сразу идти за новой станцией или открыть другой тип задания.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="glass-panel rounded-[32px] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/95 text-[#a36a00]">
                  <Timer size={24} />
                </div>
                <div>
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Задача</p>
                  <h2 className="font-display text-h4 font-black text-text">Движение</h2>
                </div>
              </div>
              <p className="mt-4 text-body-sm font-semibold text-text-muted leading-relaxed">
                {activeQuest.instruction}
              </p>
            </div>

            <div className="glass-panel rounded-[32px] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/95 text-primary">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Подсказка</p>
                  <h2 className="font-display text-h4 font-black text-text">Что это даёт</h2>
                </div>
              </div>
              <p className="mt-4 text-body-sm font-semibold text-text-muted leading-relaxed">
                Движение помогает быстрее переключиться и дольше держать внимание. Этот экран должен чувствоваться как маленький тренажёр, а не как форма.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
