import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Brain, ChevronLeft, RotateCcw, Sparkles, WandSparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { ALL_QUESTS } from '../lib/quests';
import { playSuccessSound, playTapSound } from '../lib/sfx';

interface Props {
  onComplete: (questId: string, xpReward: number, needType: string) => void;
}

type Status = 'idle' | 'success' | 'fail';

export function QuizTaskPage({ onComplete }: Props) {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const quest = ALL_QUESTS.find(item => item.id === questId && item.type === 'quiz');

  const [status, setStatus] = useState<Status>('idle');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  if (!quest || !quest.quizOptions || typeof quest.quizAnswerIndex !== 'number') {
    return (
      <main className="app-page flex min-h-screen items-center justify-center bg-[#eff4ff] px-5">
        <div className="card w-full max-w-sm text-center">
          <p className="text-h4 font-black text-text">Задание не найдено</p>
          <button className="btn-secondary mt-4 w-full" onClick={() => navigate('/')}>На карту</button>
        </div>
      </main>
    );
  }

  const activeQuest = quest;
  const quizOptions = activeQuest.quizOptions;
  if (!quizOptions) return null;
  const question = activeQuest.quizQuestion ?? activeQuest.description;

  function handlePick(index: number) {
    if (status === 'success') return;
    playTapSound();
    setSelectedIndex(index);

    if (index === activeQuest.quizAnswerIndex) {
      playSuccessSound();
      setStatus('success');
      setMessage('Правильно! Дракоша доволен.');
      timerRef.current = setTimeout(() => {
        onComplete(activeQuest.id, activeQuest.xpReward, activeQuest.needType);
      }, 650);
      return;
    }

    setStatus('fail');
    setMessage(activeQuest.quizHint ?? 'Подумай ещё раз.');
  }

  function handleRetry() {
    if (status === 'success') return;
    setSelectedIndex(null);
    setStatus('idle');
    setMessage('');
  }

  return (
    <main className="app-page relative overflow-hidden bg-[#eff4ff] text-text">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#eff4ff_0%,#f8fbff_38%,#eef9e7_100%)]" />

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
          <span className="soft-chip bg-white/90 text-blue">
            <Brain size={14} />
            Логика
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="glass-panel rounded-[36px] p-5 sm:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="min-w-0">
                <div className="map-title-chip w-fit bg-white/90">
                  <Sparkles size={14} />
                  Вопрос дня
                </div>
                <h1 className="mt-3 font-display text-h2 font-black text-text sm:text-h1">
                  {activeQuest.title}
                </h1>
                <p className="mt-3 max-w-2xl text-body-md font-semibold leading-relaxed text-text-muted">
                  {activeQuest.instruction}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">XP</p>
                    <p className="mt-2 text-h3 font-black text-blue">{activeQuest.xpReward}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Статус</p>
                    <p className="mt-2 text-body-sm font-black text-text">
                      {status === 'success' ? 'Правильно' : status === 'fail' ? 'Нужна ещё попытка' : 'Выбор ответа'}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Режим</p>
                    <p className="mt-2 text-body-sm font-black text-text">Викторина</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/70 bg-white/95 p-4 shadow-[0_18px_36px_rgba(47,47,69,0.08)]">
                <div className="overflow-hidden rounded-[24px] border border-white/70 bg-[#f8fbff]">
                  <img src="/assets/chars/dino3.png" alt="Дракоша" className="h-40 w-full object-contain" />
                </div>
                <div className="mt-4 rounded-[24px] bg-[#f8f8ff] p-4">
                  <p className="text-body-sm font-semibold text-text-muted">
                    Выбирай внимательно. У каждого варианта есть свой вес.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[30px] border border-white/70 bg-white/95 p-5 shadow-[0_18px_36px_rgba(47,47,69,0.08)]">
              <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Вопрос</p>
              <p className="mt-3 text-h3 font-black leading-tight text-text">{question}</p>
              <p className="mt-3 text-body-sm font-semibold text-text-muted">{activeQuest.description}</p>
            </div>

            <div className="mt-5">
              <div className="grid gap-3 md:grid-cols-2">
                {quizOptions.map((option, index) => {
                  const isSelected = selectedIndex === index;
                  const isCorrect = index === activeQuest.quizAnswerIndex;
                  const isWrong = status === 'fail' && isSelected && !isCorrect;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handlePick(index)}
                      className={`rounded-[26px] border p-4 text-left transition ${
                        status === 'success' && isCorrect
                          ? 'border-success bg-success/10 shadow-[0_16px_30px_rgba(47,47,69,0.08)]'
                          : isWrong
                            ? 'border-error bg-error/10 shadow-[0_16px_30px_rgba(47,47,69,0.08)]'
                            : 'border-white/70 bg-white/95 shadow-[0_12px_26px_rgba(47,47,69,0.06)] hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-body-sm font-black ${
                            status === 'success' && isCorrect
                              ? 'bg-success text-white'
                              : isWrong
                                ? 'bg-error text-white'
                                : 'bg-[#edeaff] text-primary'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="text-body-md font-black leading-snug text-text">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  key={message}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mt-5 rounded-[30px] border p-5 shadow-[0_16px_30px_rgba(47,47,69,0.08)] ${
                    status === 'success' ? 'border-success/20 bg-success/10' : 'border-error/20 bg-[#fde8e4]'
                  }`}
                >
                  <p className={`text-body-md font-black ${status === 'success' ? 'text-success' : 'text-error'}`}>
                    {message}
                  </p>
                  {status === 'fail' && (
                    <button type="button" className="btn-secondary mt-4" onClick={handleRetry}>
                      <RotateCcw size={16} />
                      Попробовать ещё раз
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-5 rounded-[30px] border border-white/70 bg-white/95 p-5 shadow-[0_16px_30px_rgba(47,47,69,0.08)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#edeaff] text-primary">
                    <WandSparkles size={24} />
                  </div>
                  <div>
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Переход</p>
                    <h2 className="font-display text-h4 font-black text-text">За наградой</h2>
                  </div>
                </div>
                <p className="mt-3 text-body-sm font-semibold text-text-muted">
                  Дракоша уже ждёт тебя на экране награды.
                </p>
              </motion.div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="glass-panel rounded-[32px] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/95 text-blue">
                  <Brain size={24} />
                </div>
                <div>
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Задача</p>
                  <h2 className="font-display text-h4 font-black text-text">Логика</h2>
                </div>
              </div>
              <p className="mt-4 text-body-sm font-semibold leading-relaxed text-text-muted">
                Раздел должен ощущаться как настольная викторина с понятной кнопкой, а не как форма ответа.
              </p>
            </div>

            <div className="glass-panel rounded-[32px] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/95 text-primary">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Совет</p>
                  <h2 className="font-display text-h4 font-black text-text">Не торопись</h2>
                </div>
              </div>
              <p className="mt-4 text-body-sm font-semibold leading-relaxed text-text-muted">
                Иногда правильный ответ самый спокойный. Сначала посмотри на вопрос целиком.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
