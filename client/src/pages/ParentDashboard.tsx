import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, ChevronRight, Gift, Heart, Sparkles, Trophy, UsersRound } from 'lucide-react';

import { ProgressBar } from '../components/ui/ProgressBar';
import { getUploads } from '../lib/api';
import { getPetMoodFromNeeds } from '../lib/gameState';
import { BADGES, getAgeLabel } from '../lib/progression';
import type { CompletedQuest, GameState } from '../types';

interface Props {
  state: GameState;
  onBack: () => void;
}

interface UploadEntry {
  url: string;
  questTitle: string;
  completedAt: string;
}

const TASK_ICON: Record<string, string> = {
  reading: '📚',
  story: '📖',
  photo: '📸',
  activity: '⚡',
};

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊',
  excited: '🤩',
  neutral: '😐',
  sad: '😢',
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function estimateMinutes(quests: CompletedQuest[]): number {
  return quests.length * 5;
}

export function ParentDashboard({ state, onBack }: Props) {
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    getUploads()
      .then(setUploads)
      .catch(() => {});
  }, []);

  const mood = getPetMoodFromNeeds(state.needs);
  const completedToday = state.completedQuestsToday;
  const totalXpToday = completedToday.reduce((sum, quest) => sum + quest.xpEarned, 0);
  const minutes = estimateMinutes(completedToday);
  const recentBadges = state.badges.slice(-4).reverse();
  const recentGifts = state.giftCollection.slice(0, 3);

  const localPhotos = completedToday
    .filter(quest => quest.taskType === 'photo' && quest.photoUrl)
    .map(quest => ({ url: quest.photoUrl!, title: quest.title }));

  const apiPhotos = uploads.map(upload => ({ url: upload.url, title: upload.questTitle }));
  const allPhotos = [
    ...localPhotos,
    ...apiPhotos.filter(candidate => !localPhotos.some(photo => photo.url === candidate.url)),
  ];

  const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="app-page min-h-screen bg-[#eef9ff] text-text">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.9),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(255,216,153,0.24),transparent_18%),linear-gradient(180deg,#eef9ff_0%,#f6fbff_38%,#edf9e7_100%)]" />

      <div className="page-shell relative z-10 py-4">
        <div className="mb-4 rounded-[32px] glass-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onBack}
              className="soft-chip bg-white/90 text-text-muted"
              aria-label="Закрыть панель родителей"
            >
              ← Назад
            </button>
            <div className="text-right">
              <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">
                Панель родителей
              </p>
              <h1 className="font-display text-h3 font-black text-text">Сводка дня</h1>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-4">
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-[34px] p-5 sm:p-6"
            >
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
                <div className="min-w-0">
                  <div className="map-title-chip w-fit bg-white/90">
                    <Sparkles size={14} />
                    Профиль ребёнка
                  </div>
                  <h2 className="mt-3 font-display text-h2 font-black text-text sm:text-h1">
                    {state.childName || 'Ребёнок'}
                  </h2>
                  <p className="mt-2 max-w-xl text-body-md font-semibold text-text-muted">
                    Сегодняшний темп, прогресс и последние действия собраны в одном месте.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="soft-chip bg-white/90 text-text-muted">
                      <UsersRound size={13} />
                      {getAgeLabel(state.ageGroup)}
                    </span>
                    <span className="soft-chip bg-white/90 text-text-muted">
                      <Heart size={13} />
                      {mood === 'excited' ? 'очень бодрый' : mood === 'happy' ? 'спокойно и хорошо' : mood === 'sad' ? 'нужна пауза' : 'ровный ритм'}
                    </span>
                    <span className="soft-chip bg-white/90 text-text-muted">
                      <Trophy size={13} />
                      Серия {state.streak}
                    </span>
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/70 bg-white/96 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#edeaff] text-primary">
                      <span className="text-4xl">{MOOD_EMOJI[mood] ?? '😊'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Питомец</p>
                      <h3 className="truncate font-display text-h4 font-black text-text">{state.pet.name}</h3>
                      <p className="text-caption font-black text-primary">Уровень {state.pet.level}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[24px] bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-caption font-black text-text-muted">XP до следующего уровня</span>
                      <span className="text-caption font-black text-primary">
                        {state.pet.xp}/{state.pet.xpToNext}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-primary-light">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(0, Math.min(100, Math.round((state.pet.xp / state.pet.xpToNext) * 100)))}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-[18px] bg-[#fff3c8]/95 p-3 text-center">
                      <div className="text-caption font-black uppercase tracking-[0.06em] text-[#a36a00]">Сегодня</div>
                      <div className="mt-2 text-h4 font-black text-[#875900]">{completedToday.length}</div>
                    </div>
                    <div className="rounded-[18px] bg-[#e5f5ff]/95 p-3 text-center">
                      <div className="text-caption font-black uppercase tracking-[0.06em] text-blue">XP</div>
                      <div className="mt-2 text-h4 font-black text-blue">{totalXpToday}</div>
                    </div>
                    <div className="rounded-[18px] bg-[#ffe8ea]/95 p-3 text-center">
                      <div className="text-caption font-black uppercase tracking-[0.06em] text-brand">Мин</div>
                      <div className="mt-2 text-h4 font-black text-brand">{minutes}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="glass-panel rounded-[34px] p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-h4 font-black text-text">Потребности</h2>
                  <p className="text-body-sm font-semibold text-text-muted">Показывают, что нужно драконе прямо сейчас.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                {state.needs.map(need => (
                  <ProgressBar
                    key={need.type}
                    value={need.value}
                    max={need.maxValue}
                    color={need.color}
                    label={need.label}
                    emoji={need.emoji}
                    showValue
                  />
                ))}
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="glass-panel rounded-[34px] p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-h4 font-black text-text">Сегодняшняя активность</h2>
                  <p className="text-body-sm font-semibold text-text-muted">Последние задания и время выполнения.</p>
                </div>
                <span className="soft-chip bg-white/90 text-text-muted">
                  {completedToday.length} событий
                </span>
              </div>

              {completedToday.length > 0 ? (
                <motion.ul
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="mt-4 flex flex-col gap-3"
                >
                  {[...completedToday].reverse().map((quest, index) => (
                    <motion.li
                      key={`${quest.questId}-${index}`}
                      variants={itemVariants}
                      className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_12px_24px_rgba(47,47,69,0.06)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#edeaff] text-lg">
                          {TASK_ICON[quest.taskType] ?? '✅'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-body-sm font-black text-text">{quest.title}</p>
                          <p className="text-caption text-text-muted">
                            {formatTime(quest.completedAt)} · +{quest.xpEarned} XP
                          </p>
                        </div>
                        {quest.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(quest.photoUrl!)}
                            className="shrink-0"
                            aria-label={`Открыть фото: ${quest.title}`}
                          >
                            <img
                              src={quest.photoUrl}
                              alt={quest.title}
                              className="h-10 w-10 rounded-[14px] object-cover border border-white/80"
                            />
                          </button>
                        )}
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (
                <div className="mt-4 rounded-[24px] border border-dashed border-white/80 bg-white/80 p-5 text-body-sm font-semibold text-text-muted">
                  Пока нет заданий. Когда ребёнок начнёт маршрут, они появятся здесь.
                </div>
              )}
            </motion.section>

            {allPhotos.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="glass-panel rounded-[34px] p-5 sm:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-h4 font-black text-text">Фотогалерея</h2>
                    <p className="text-body-sm font-semibold text-text-muted">Снимки из выполненных фото-заданий.</p>
                  </div>
                  <span className="soft-chip bg-white/90 text-text-muted">
                    <Camera size={13} />
                    {allPhotos.length}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {allPhotos.map((photo, index) => (
                    <motion.button
                      key={photo.url + index}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => setLightboxUrl(photo.url)}
                      className="overflow-hidden rounded-[22px] border border-white/70 bg-white/95 shadow-[0_12px_24px_rgba(47,47,69,0.06)]"
                      aria-label={`Открыть фото: ${photo.title}`}
                    >
                      <img src={photo.url} alt={photo.title} className="h-32 w-full object-cover" />
                    </motion.button>
                  ))}
                </div>
              </motion.section>
            )}

            {recentBadges.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="glass-panel rounded-[34px] p-5 sm:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-h4 font-black text-text">Последние значки</h2>
                    <p className="text-body-sm font-semibold text-text-muted">Новые достижения и их смысл.</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {recentBadges.map(id => (
                    <span
                      key={id}
                      className="soft-chip text-white"
                      style={{ background: BADGES[id].color }}
                    >
                      <span>{BADGES[id].emoji}</span>
                      {BADGES[id].title}
                    </span>
                  ))}
                </div>
              </motion.section>
            )}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 self-start">
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-[34px] p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/95 text-primary">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Сводка</p>
                  <h2 className="font-display text-h4 font-black text-text">День в цифрах</h2>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-[22px] bg-white/95 p-4">
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Сегодня XP</p>
                  <p className="mt-2 text-h2 font-black text-primary">{totalXpToday}</p>
                </div>
                <div className="rounded-[22px] bg-white/95 p-4">
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Действий</p>
                  <p className="mt-2 text-h2 font-black text-brand">{completedToday.length}</p>
                </div>
                <div className="rounded-[22px] bg-white/95 p-4">
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Минут</p>
                  <p className="mt-2 text-h2 font-black text-[#a36a00]">{minutes}</p>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="glass-panel rounded-[34px] p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/95 text-primary">
                  <Trophy size={24} />
                </div>
                <div>
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Профиль</p>
                  <h2 className="font-display text-h4 font-black text-text">Прогресс</h2>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <ProgressBar
                  label="Чтение / история"
                  value={state.questTypeCounts.reading + state.questTypeCounts.story}
                  max={Math.max(1, state.lifetimeQuestsCompleted)}
                  color="#765fde"
                  showValue
                />
                <ProgressBar
                  label="Фото"
                  value={state.questTypeCounts.photo}
                  max={Math.max(1, state.lifetimeQuestsCompleted)}
                  color="#ff6170"
                  showValue
                />
                <ProgressBar
                  label="Движение"
                  value={state.questTypeCounts.activity}
                  max={Math.max(1, state.lifetimeQuestsCompleted)}
                  color="#f0a000"
                  showValue
                />
                <ProgressBar
                  label="Логика"
                  value={state.questTypeCounts.quiz}
                  max={Math.max(1, state.lifetimeQuestsCompleted)}
                  color="#4d75ff"
                  showValue
                />
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.09 }}
              className="glass-panel rounded-[34px] p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-h4 font-black text-text">Подарки</h2>
                  <p className="text-body-sm font-semibold text-text-muted">Что ребёнок уже получил от героев карты.</p>
                </div>
                <span className="soft-chip bg-white/90 text-primary">
                  <Gift size={13} />
                  {recentGifts.length}
                </span>
              </div>

              {recentGifts.length > 0 ? (
                <div className="mt-4 grid gap-2">
                  {recentGifts.map(gift => (
                    <div key={`${gift.companionId}-${gift.questId}`} className="rounded-[22px] bg-white/95 p-4 shadow-[0_12px_24px_rgba(47,47,69,0.06)]">
                      <p className="text-caption font-black uppercase tracking-[0.08em] text-primary">{gift.companionName}</p>
                      <p className="mt-1 text-body-sm font-black text-text">{gift.gift}</p>
                      <p className="mt-1 text-caption font-semibold text-text-muted">{gift.questTitle}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[24px] border border-dashed border-white/80 bg-white/80 p-5 text-body-sm font-semibold text-text-muted">
                  Пока подарков нет. После первых заданий они появятся здесь.
                </div>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="glass-panel rounded-[34px] p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/95 text-primary">
                  <Heart size={24} />
                </div>
                <div>
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Совет</p>
                  <h2 className="font-display text-h4 font-black text-text">Что дальше</h2>
                </div>
              </div>

              <p className="mt-4 text-body-sm font-semibold leading-relaxed text-text-muted">
                {minutes > 0
                  ? `Сегодня уже было примерно ${minutes} минут активности. Можно выбрать лёгкое чтение или спокойное фото-задание.`
                  : 'Пока нет выполненных заданий. Начните с одной короткой точки, чтобы Дракоша быстрее вошёл в ритм.'}
              </p>

              <button
                type="button"
                onClick={onBack}
                className="btn-primary mt-4 w-full"
              >
                Вернуться к карте
                <ChevronRight size={16} />
              </button>
            </motion.section>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
            onClick={() => setLightboxUrl(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Просмотр фото"
          >
            <motion.img
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              src={lightboxUrl}
              alt="Фото в полном размере"
              className="max-h-[85vh] max-w-full rounded-[28px] object-contain shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute right-5 top-5 text-3xl font-bold leading-none text-white"
              aria-label="Закрыть"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
