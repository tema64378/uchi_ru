import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronLeft, Mic, RotateCcw, Sparkles, WandSparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { validateSpeech } from '../lib/api';
import { ALL_QUESTS } from '../lib/quests';
import type { ValidationStatus } from '../types';

interface Props {
  onComplete: (questId: string, xpReward: number, needType: string) => void;
}

function offlineValidate(transcript: string, targetText: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^а-яёa-z\s]/gi, '').trim();
  const targetWords = normalize(targetText).split(/\s+/).filter(Boolean);
  const spokenWords = new Set(normalize(transcript).split(/\s+/).filter(Boolean));
  const matched = targetWords.filter(word => spokenWords.has(word)).length;
  return matched / targetWords.length >= 0.3;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function ReadingTaskPage({ onComplete }: Props) {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const speech = useSpeechRecognition();

  const [status, setStatus] = useState<ValidationStatus>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const autoNavTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const quest = ALL_QUESTS.find(item => item.id === questId);

  useEffect(() => () => {
    if (autoNavTimer.current) clearTimeout(autoNavTimer.current);
    speech.reset();
  }, []);

  if (!quest) {
    return (
      <main className="app-page flex min-h-screen items-center justify-center bg-[#f5f4ff] px-5">
        <div className="card w-full max-w-sm text-center">
          <p className="text-h4 font-black text-text">Задание не найдено</p>
          <button className="btn-primary mt-4 w-full" onClick={() => navigate('/')}>На главную</button>
        </div>
      </main>
    );
  }

  const questData = quest;
  const isStory = questData.type === 'story';
  const isListening = speech.state === 'listening';
  const readingText = questData.readingText ?? questData.description;

  async function handleStop() {
    speech.stop();
    const currentTranscript = speech.transcript.trim();

    if (!currentTranscript) {
      setStatus('fail');
      setResultMessage('Ничего не услышал... Попробуй ещё раз!');
      return;
    }

    if (isStory) {
      if (countWords(currentTranscript) >= 20) {
        markSuccess('Отлично! Дракоша в восторге от твоей истории!');
      } else {
        setStatus('fail');
        setResultMessage('Расскажи немного больше — продолжай историю!');
      }
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateSpeech(currentTranscript, readingText);
      if (result.ok) {
        markSuccess('Молодец! Дракоша слушал!');
      } else {
        setStatus('fail');
        setResultMessage('Попробуй ещё раз! Читай чётче и медленнее.');
      }
    } catch {
      const passed = offlineValidate(currentTranscript, readingText);
      if (passed) {
        markSuccess('Молодец! Дракоша слушал!');
      } else {
        setStatus('fail');
        setResultMessage('Попробуй ещё раз! Читай чётче и медленнее.');
      }
    } finally {
      setIsValidating(false);
    }
  }

  function markSuccess(msg: string) {
    setStatus('success');
    setResultMessage(msg);
    if (autoNavTimer.current) clearTimeout(autoNavTimer.current);
    autoNavTimer.current = setTimeout(() => {
      onComplete(questData.id, questData.xpReward, questData.needType);
    }, 700);
  }

  function handleRetry() {
    if (autoNavTimer.current) clearTimeout(autoNavTimer.current);
    speech.reset();
    setStatus('idle');
    setResultMessage('');
  }

  function handleDoneFallback() {
    markSuccess('Молодец! Дракоша слушал!');
  }

  return (
    <main className="app-page relative overflow-hidden bg-[#f5f4ff] text-text">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#f5f4ff_0%,#fbfbff_34%,#eef9ff_100%)]" />

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
          <span className="soft-chip bg-white/90 text-primary">
            <BookOpen size={14} />
            Чтение
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="glass-panel rounded-[36px] p-5 sm:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="min-w-0">
                <div className="map-title-chip w-fit bg-white/90">
                  <Sparkles size={14} />
                  {isStory ? 'История' : 'Чтение вслух'}
                </div>
                <h1 className="mt-3 font-display text-h2 font-black text-text sm:text-h1">
                  {questData.title}
                </h1>
                <p className="mt-3 max-w-2xl text-body-md font-semibold leading-relaxed text-text-muted">
                  {questData.instruction}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Тип</p>
                    <p className="mt-2 text-body-sm font-black text-text">{isStory ? 'История' : 'Текст'}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">XP</p>
                    <p className="mt-2 text-h3 font-black text-primary">{questData.xpReward}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Режим</p>
                    <p className="mt-2 text-body-sm font-black text-text">
                      {status === 'success' ? 'Готово' : isListening ? 'Слушаю' : 'Старт'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/70 bg-white/95 p-4 shadow-[0_18px_36px_rgba(47,47,69,0.08)]">
                <div className="overflow-hidden rounded-[24px] border border-white/70 bg-[#f8fbff]">
                  <img
                    src="/assets/chars/dino2.png"
                    alt="Дракоша слушает"
                    className="h-40 w-full object-contain"
                  />
                </div>
                <div className="mt-4 rounded-[24px] bg-[#f8f8ff] p-4">
                  <p className="text-body-sm font-semibold text-text-muted">
                    {isListening
                      ? 'Дракоша слушает очень внимательно.'
                      : 'Прочитай вслух и нажми на микрофон, когда будешь готов.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[30px] border border-white/70 bg-white/95 p-5 shadow-[0_18px_36px_rgba(47,47,69,0.08)]">
              <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Текст задания</p>
              <p
                className="mt-3 max-w-4xl font-semibold leading-relaxed text-text"
                style={{ fontSize: 'clamp(18px, 2vw, 22px)', lineHeight: 1.7 }}
              >
                {readingText}
              </p>
            </div>

            <div className="mt-5">
              <AnimatePresence mode="wait">
                {status === 'idle' || status === 'validating' ? (
                  <motion.div
                    key="controls"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px]"
                  >
                    <div className="rounded-[30px] border border-white/70 bg-[#edeaff] p-5 shadow-[0_16px_30px_rgba(47,47,69,0.08)]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-primary">
                          <Mic size={24} />
                        </div>
                        <div>
                          <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Запись</p>
                          <h2 className="font-display text-h4 font-black text-text">
                            {isListening ? 'Говори сейчас' : 'Нажми на микрофон'}
                          </h2>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col items-center gap-4">
                        <div className="relative flex items-center justify-center">
                          {isListening && (
                            <span
                              aria-hidden="true"
                              className="speech-pulse absolute"
                              style={{ width: 88, height: 88, borderRadius: '50%' }}
                            />
                          )}
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={isListening ? undefined : speech.start}
                            disabled={isValidating || isListening}
                            aria-label={isListening ? 'Запись идёт' : 'Начать запись'}
                            className="relative z-10 flex items-center justify-center rounded-full text-white font-black text-3xl shadow-btn transition-all duration-200 disabled:opacity-70"
                            style={{
                              width: 88,
                              height: 88,
                              background: isListening ? '#e93017' : '#765fde',
                            }}
                          >
                            <span aria-hidden="true">{isListening ? '●' : '🎤'}</span>
                          </motion.button>
                        </div>

                        {speech.transcript ? (
                          <div className="w-full rounded-[22px] bg-white p-4 shadow-[0_12px_26px_rgba(47,47,69,0.08)]">
                            <p className="text-body-sm font-semibold italic leading-relaxed text-primary">
                              "{speech.transcript}"
                            </p>
                          </div>
                        ) : isListening ? (
                          <div className="w-full rounded-[22px] bg-white p-4 text-center shadow-[0_12px_26px_rgba(47,47,69,0.08)]">
                            <span className="text-body-sm text-text-muted">Говори вслух...</span>
                          </div>
                        ) : (
                          <div className="w-full rounded-[22px] bg-white p-4 text-center shadow-[0_12px_26px_rgba(47,47,69,0.08)]">
                            <span className="text-body-sm text-text-muted">Когда будешь готов, нажми микрофон.</span>
                          </div>
                        )}

                        {isListening && (
                          <button
                            type="button"
                            onClick={handleStop}
                            className="btn-brand w-full"
                            disabled={isValidating}
                          >
                            {isValidating ? 'Проверяю...' : 'Стоп и проверить'}
                          </button>
                        )}

                        {!isListening && speech.transcript && status === 'idle' && (
                          <button
                            type="button"
                            onClick={handleStop}
                            className="btn-primary w-full"
                            disabled={isValidating}
                          >
                            {isValidating ? 'Проверяю...' : 'Проверить ответ'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="rounded-[28px] border border-white/70 bg-white/95 p-4">
                        <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Подсказка</p>
                        <p className="mt-2 text-body-sm font-semibold text-text-muted">
                          {isStory
                            ? 'Расскажи историю живо и длиннее двадцати слов.'
                            : 'Читай спокойно и чётко, чтобы система распознала слова лучше.'}
                        </p>
                      </div>

                      {!speech.supported && (
                        <div className="rounded-[28px] border border-white/70 bg-white/95 p-4">
                          <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">
                            Режим без микрофона
                          </p>
                          <button onClick={handleDoneFallback} className="btn-primary mt-3 w-full">
                            Я прочитал
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px]"
                  >
                    <div className="rounded-[30px] border border-success/20 bg-success/10 p-5 shadow-[0_16px_30px_rgba(47,47,69,0.08)]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-success">
                          <WandSparkles size={24} />
                        </div>
                        <div>
                          <p className="text-caption font-black uppercase tracking-[0.08em] text-success">Успех</p>
                          <h2 className="font-display text-h4 font-black text-text">Принято</h2>
                        </div>
                      </div>
                      <p className="mt-4 text-body-md font-black text-success">
                        {resultMessage}
                      </p>
                      <p className="mt-2 text-body-sm font-semibold text-text-muted">
                        +{questData.xpReward} XP для Дракоши.
                      </p>
                    </div>

                    <div className="rounded-[30px] border border-white/70 bg-white/95 p-4 shadow-[0_16px_30px_rgba(47,47,69,0.08)]">
                      <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Дальше</p>
                      <p className="mt-2 text-body-sm font-semibold text-text-muted">
                        Возвращайся на карту или выбери ещё одно чтение.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="fail"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px]"
                  >
                    <div
                      className="rounded-[30px] border border-error/20 bg-[#fde8e4] p-5 shadow-[0_16px_30px_rgba(47,47,69,0.08)]"
                      role="alert"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-error">
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <p className="text-caption font-black uppercase tracking-[0.08em] text-error">Попробуй ещё</p>
                          <h2 className="font-display text-h4 font-black text-text">Не получилось</h2>
                        </div>
                      </div>
                      <p className="mt-4 text-body-md font-black text-error">
                        {resultMessage}
                      </p>
                      <button type="button" onClick={handleRetry} className="btn-primary mt-4 w-full">
                        <RotateCcw size={16} />
                        Попробовать ещё раз
                      </button>
                    </div>

                    <div className="rounded-[30px] border border-white/70 bg-white/95 p-4 shadow-[0_16px_30px_rgba(47,47,69,0.08)]">
                      <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Совет</p>
                      <p className="mt-2 text-body-sm font-semibold text-text-muted">
                        Читай чуть медленнее и чётче, тогда распознавание срабатывает лучше.
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
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/95 text-primary">
                  <BookOpen size={24} />
                </div>
                <div>
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Задание</p>
                  <h2 className="font-display text-h4 font-black text-text">Чтение</h2>
                </div>
              </div>
              <p className="mt-4 text-body-sm font-semibold leading-relaxed text-text-muted">
                {questData.description}
              </p>
            </div>

            <div className="glass-panel rounded-[32px] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/95 text-primary">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Питомец</p>
                  <h2 className="font-display text-h4 font-black text-text">Дракоша слушает</h2>
                </div>
              </div>
              <p className="mt-4 text-body-sm font-semibold leading-relaxed text-text-muted">
                Этот экран должен ощущаться как спокойная сценка для чтения, а не как техническая форма.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
