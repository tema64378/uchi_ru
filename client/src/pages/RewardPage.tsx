import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Gift, Sparkles, Star, Trophy } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { getCompanionByNeed } from '../lib/companions';
import { BADGES } from '../lib/progression';
import { ALL_QUESTS } from '../lib/quests';
import type { BadgeId, Quest } from '../types';

interface Props {
  onRewardCollected: () => void;
}

interface RewardLocationState {
  xpEarned?: number;
  levelUp?: boolean;
  newLevel?: number;
  newBadges?: BadgeId[];
  streak?: number;
  totalQuests?: number;
}

interface ConfettiPiece {
  id: number;
  left: string;
  delay: string;
  duration: string;
  size: string;
  color: string;
  rotate: string;
}

function getQuestMood(quest?: Quest): string {
  if (!quest) return 'Дракоша доволен';
  if (quest.type === 'photo') return 'Поймал красивый кадр';
  if (quest.type === 'activity') return 'Поймал ритм';
  if (quest.type === 'quiz') return 'Разгадал загадку';
  if (quest.type === 'story') return 'Слушал историю';
  return 'Прочитал вслух';
}

export function RewardPage({ onRewardCollected }: Props) {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const rewardState = (location.state ?? {}) as RewardLocationState;

  const quest = ALL_QUESTS.find(item => item.id === questId);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const confetti = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: 18 }, (_, index) => {
        const palette = ['#765fde', '#ff6170', '#f0a000', '#3aafff', '#9f7aea', '#ffffff'];
        return {
          id: index,
          left: `${8 + ((index * 13) % 84)}%`,
          delay: `${(index % 6) * 0.18}s`,
          duration: `${2.7 + (index % 4) * 0.4}s`,
          size: `${8 + (index % 3) * 4}px`,
          color: palette[index % palette.length],
          rotate: `${(index % 5) * 45}deg`,
        };
      }),
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      onRewardCollected();
    }, 5200);

    return () => clearTimeout(timer);
  }, [onRewardCollected]);

  const xpEarned = rewardState.xpEarned ?? quest?.xpReward ?? 0;
  const newLevel = rewardState.newLevel ?? 0;
  const newBadges = rewardState.newBadges ?? [];
  const streak = rewardState.streak ?? 0;
  const totalQuests = rewardState.totalQuests ?? 0;
  const levelUp = rewardState.levelUp ?? false;
  const giftGiver = quest ? getCompanionByNeed(quest.needType) : null;

  const badgeCards = newBadges.map(id => BADGES[id]).filter(Boolean);

  function handleBackToMap() {
    onRewardCollected();
  }

  function handleOpenQuestAgain() {
    if (!quest) return;
    navigate(`/quest/${quest.needType}`);
  }

  if (!quest) {
    return (
      <div className="app-page flex min-h-screen items-center justify-center bg-[#eef9ff] px-5">
        <div className="card w-full max-w-sm text-center">
          <p className="text-h4 font-black text-text">Награда не найдена</p>
          <button className="btn-primary mt-4 w-full" onClick={() => navigate('/')}>
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="app-page relative overflow-hidden bg-[#eef9ff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.92),transparent_26%),radial-gradient(circle_at_82%_8%,rgba(255,216,153,0.24),transparent_18%),linear-gradient(180deg,#eef9ff_0%,#f6fbff_35%,#edf9e7_100%)]" />

      <div className="page-shell relative z-10 flex min-h-screen items-center py-6">
        <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1.1fr)_380px] lg:items-center">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 18 }}
            className="glass-panel rounded-[36px] p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="map-title-chip w-fit bg-white/90 text-text-muted">
                <Gift size={14} />
                Награда
              </div>
              <button
                type="button"
                onClick={handleBackToMap}
                className="soft-chip bg-white/90 text-primary"
              >
                Вернуться на карту
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="min-w-0">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  className="inline-flex items-center gap-3 rounded-[30px] border border-white/70 bg-white/95 px-5 py-4 shadow-[0_18px_36px_rgba(47,47,69,0.08)]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#edeaff] text-primary">
                    <Sparkles size={28} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">
                      {quest.needType === 'learning' ? 'Знания' : quest.needType === 'creative' ? 'Творчество' : 'Движение'}
                    </p>
                    <h1 className="truncate font-display text-h2 font-black text-text sm:text-h1">
                      {quest.title}
                    </h1>
                  </div>
                </motion.div>

                <p className="mt-4 max-w-2xl text-body-md font-semibold text-text-muted">
                  {getQuestMood(quest)}. Забирай результат и возвращайся на карту к следующей точке.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">XP</p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-h2 font-black text-primary">+{xpEarned}</span>
                      <span className="pb-1 text-caption font-black text-text-muted">за задание</span>
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Серия</p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-h2 font-black text-[#a36a00]">{streak}</span>
                      <span className="pb-1 text-caption font-black text-text-muted">дней</span>
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Заданий</p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-h2 font-black text-brand">{totalQuests}</span>
                      <span className="pb-1 text-caption font-black text-text-muted">всего</span>
                    </div>
                  </div>
                </div>

                {badgeCards.length > 0 && (
                  <div className="mt-5 rounded-[30px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <div className="flex items-center gap-2 text-text-muted">
                      <Trophy size={16} />
                      <span className="text-caption font-black uppercase tracking-[0.08em]">Новые значки</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {badgeCards.map(badge => (
                        <span
                          key={badge.id}
                          className="soft-chip text-white"
                          style={{ background: badge.color }}
                        >
                          <span>{badge.emoji}</span>
                          {badge.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-[32px] border border-white/70 bg-white/95 p-4 shadow-[0_18px_36px_rgba(47,47,69,0.08)]">
                <div className="rounded-[24px] bg-[#edeaff] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] bg-white">
                      {giftGiver && <img src={giftGiver.asset} alt={giftGiver.name} className="h-full w-full object-contain" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Подарок героя</p>
                      <h3 className="truncate font-display text-h4 font-black text-text">{giftGiver?.name ?? 'Герой карты'}</h3>
                    </div>
                  </div>
                  <div className="mt-3 rounded-[20px] bg-white/92 p-3">
                    <p className="text-body-sm font-black text-primary">
                      {giftGiver ? `${giftGiver.name} дарит тебе ${giftGiver.gift}` : 'Подарок уже ждёт тебя'}
                    </p>
                    <p className="mt-1 text-[12px] font-semibold leading-snug text-text-muted">
                      Подарок открывается только после завершения задания. Сейчас он уже у тебя.
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[26px] border border-white/70 bg-[#f8fbff]">
                  <img
                    src={
                      quest.needType === 'creative'
                        ? '/assets/scenes/reading2.png'
                        : quest.needType === 'energy'
                          ? '/assets/scenes/reading3.png'
                          : '/assets/scenes/reading1.png'
                    }
                    alt=""
                    className="h-48 w-full object-cover"
                    />
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#ffe8ea] text-brand">
                    <Star size={28} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Статус</p>
                    <h2 className="truncate font-display text-h4 font-black text-text">
                      {levelUp ? `Новый уровень ${newLevel}` : 'Молодец!'}
                    </h2>
                  </div>
                </div>

                <div className="mt-4 rounded-[24px] bg-[#f8f8ff] p-4">
                  <p className="text-body-sm font-semibold text-text-muted">
                    Дракоша запомнил твоё задание и уже ждёт следующую точку на карте.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleBackToMap}
                  className="btn-primary mt-4 w-full"
                >
                  На карту
                </button>
                <button
                  type="button"
                  onClick={handleOpenQuestAgain}
                  className="btn-secondary mt-3 w-full"
                >
                  Ещё раз в это занятие
                </button>
              </div>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 24 }}
            transition={{ delay: 0.08 }}
            className="glass-panel rounded-[34px] p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/95 text-primary">
                <Trophy size={24} />
              </div>
              <div>
                <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Успех</p>
                <h2 className="font-display text-h4 font-black text-text">Награда получена</h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-[24px] bg-white/95 p-4 shadow-[0_14px_28px_rgba(47,47,69,0.08)]">
                <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Что дальше</p>
                <p className="mt-2 text-body-sm font-semibold text-text">
                  Выбирай новую станцию и продолжай маршрут, пока карта горячая.
                </p>
              </div>

              <div className="rounded-[24px] bg-white/95 p-4 shadow-[0_14px_28px_rgba(47,47,69,0.08)]">
                <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Автопереход</p>
                <p className="mt-2 text-body-sm font-semibold text-text">
                  Страница вернёт тебя на карту сама через несколько секунд.
                </p>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>

      <AnimatePresence>
        {ready && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {confetti.map(piece => (
              <span
                key={piece.id}
                className="confetti-piece"
                style={{
                  left: piece.left,
                  top: '-10px',
                  width: piece.size,
                  height: piece.size,
                  background: piece.color,
                  transform: `rotate(${piece.rotate})`,
                  animationDuration: piece.duration,
                  animationDelay: piece.delay,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
