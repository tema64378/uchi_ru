import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronRight, Clock3, MapPin, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { getAgeLabel } from '../lib/progression';
import { getQuestsByNeedForAge } from '../lib/quests';
import { playTapSound } from '../lib/sfx';
import type { GameState, Quest } from '../types';

interface Props {
  state: GameState;
}

const NEED_META: Record<string, { title: string; emoji: string; color: string; bg: string; badge: string; scene: string }> = {
  learning: {
    title: 'Знания',
    emoji: '📚',
    color: '#765fde',
    bg: '#F5F4FF',
    badge: '#EDEAFF',
    scene: '/assets/scenes/reading1.png',
  },
  creative: {
    title: 'Творчество',
    emoji: '🎨',
    color: '#ff6170',
    bg: '#FFF5F5',
    badge: '#FFE8EA',
    scene: '/assets/scenes/reading2.png',
  },
  energy: {
    title: 'Энергия',
    emoji: '⚡',
    color: '#f0a000',
    bg: '#FFFBEF',
    badge: '#FFF3C8',
    scene: '/assets/scenes/reading3.png',
  },
};

const TASK_TYPE_META: Record<string, { icon: string; label: string }> = {
  reading: { icon: '🎤', label: 'Чтение вслух' },
  story: { icon: '📖', label: 'История' },
  photo: { icon: '📸', label: 'Фото-задание' },
  activity: { icon: '🏃', label: 'Активность' },
  quiz: { icon: '🧠', label: 'Логика и счёт' },
};

function getTaskMeta(quest: Quest) {
  return TASK_TYPE_META[quest.type] ?? TASK_TYPE_META.reading;
}

export function QuestSelectPage({ state }: Props) {
  const { needType = 'learning' } = useParams();
  const navigate = useNavigate();
  const meta = NEED_META[needType] ?? NEED_META.learning;

  const availableQuests = useMemo(() => getQuestsByNeedForAge(needType, state.ageGroup), [needType, state.ageGroup]);
  const fallbackQuest = availableQuests[0];
  const [selectedQuestId, setSelectedQuestId] = useState(fallbackQuest?.id ?? '');
  const selectedQuest = availableQuests.find(quest => quest.id === selectedQuestId) ?? fallbackQuest;

  function startQuest() {
    if (!selectedQuest) return;
    playTapSound();
    navigate(`/task/${selectedQuest.type}/${selectedQuest.id}`);
  }

  return (
    <main className="app-page relative overflow-hidden bg-[#edf8ff] text-text">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,255,255,0.9),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.5),transparent_22%),linear-gradient(180deg,#eef9ff_0%,#f8fcff_26%,#eef8e8_70%,#d8ecb9_100%)]" />

      <div className="page-shell relative z-10 py-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="min-w-0 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-caption font-black text-text-muted shadow-[0_8px_18px_rgba(47,47,69,0.08)]"
              >
                ← Назад
              </button>
              <span className="soft-chip bg-white/90 text-text-muted">
                <CalendarDays size={13} />
                {getAgeLabel(state.ageGroup)}
              </span>
            </div>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-[34px] p-5 sm:p-6"
            >
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-w-0">
                  <div className="map-title-chip w-fit bg-white/85">
                    <MapPin size={14} />
                    {meta.title}
                  </div>
                  <h1 className="mt-3 font-display text-h2 font-black text-text sm:text-h1">
                    Выбери задание
                  </h1>
                  <p className="mt-3 max-w-2xl text-body-md font-semibold text-text-muted">
                    Нажми на задание, посмотри, что нужно сделать, и нажми «Начать».
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="soft-chip bg-white/90" style={{ color: meta.color }}>
                      <Sparkles size={13} />
                      {meta.title}
                    </span>
                    <span className="soft-chip bg-white/90 text-text-muted">
                      <Clock3 size={13} />
                      {selectedQuest?.duration ? `Около ${selectedQuest.duration} сек` : 'Короткое задание'}
                    </span>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/70 bg-white/96 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.1)]">
                  <div className="overflow-hidden rounded-[22px] border border-white/70 shadow-[0_10px_24px_rgba(47,47,69,0.08)]">
                    <img src={meta.scene} alt="" className="h-28 w-full object-cover" />
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px]" style={{ background: meta.badge, color: meta.color }}>
                      <span className="text-3xl leading-none">{meta.emoji}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Направление</p>
                      <h2 className="truncate font-display text-h4 font-black text-text">{meta.title}</h2>
                      <p className="text-caption font-black" style={{ color: meta.color }}>
                        {availableQuests.length} заданий
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            <section className="grid gap-3 md:grid-cols-2">
              {availableQuests.map(quest => {
                const isActive = selectedQuest?.id === quest.id;
                const taskMeta = getTaskMeta(quest);
                return (
                  <button
                    key={quest.id}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setSelectedQuestId(quest.id);
                    }}
                    className={`rounded-[24px] border p-4 text-left transition ${
                      isActive ? 'border-primary/30 bg-white shadow-[0_18px_36px_rgba(47,47,69,0.14)]' : 'border-white/60 bg-white/96 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
                        style={{ background: meta.badge, color: meta.color }}
                      >
                        <span className="text-xl leading-none">{taskMeta.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black"
                            style={{ background: meta.badge, color: meta.color }}
                          >
                            {taskMeta.label}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-black text-text-muted">
                            {quest.xpReward} XP
                          </span>
                        </div>
                        <h3 className="truncate text-body-sm font-black text-text">{quest.title}</h3>
                        <p className="mt-1 max-h-[2.9rem] overflow-hidden text-[13px] font-semibold leading-snug text-text-muted">
                          {quest.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4">
            <motion.section
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel rounded-[34px] p-4 sm:p-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px]"
                  style={{ background: meta.badge, color: meta.color }}
                >
                  <span className="text-4xl leading-none">{meta.emoji}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Выбрано</p>
                  <h2 className="truncate font-display text-h4 font-black text-text">{selectedQuest?.title ?? 'Задание'}</h2>
                  <p className="text-caption font-black" style={{ color: meta.color }}>
                    +{selectedQuest?.xpReward ?? 0} XP
                  </p>
                </div>
              </div>

              {selectedQuest && (
                <>
                  <p className="mt-3 text-body-sm font-semibold leading-snug text-text-muted">
                    {selectedQuest.description}
                  </p>
                  <p
                    className="mt-3 rounded-[22px] p-4 text-body-sm font-black text-text shadow-[0_10px_24px_rgba(47,47,69,0.08)]"
                    style={{ background: meta.badge }}
                  >
                    {selectedQuest.instruction}
                  </p>

                  <div className="mt-4 space-y-2 rounded-[24px] border border-white/70 bg-white/96 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Детали</span>
                      {selectedQuest.duration && (
                        <span className="text-caption font-black text-text-muted">~{selectedQuest.duration} сек</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="soft-chip bg-white/90" style={{ color: meta.color }}>
                        <Sparkles size={13} />
                        {meta.title}
                      </span>
                      <span className="soft-chip bg-white/90 text-text-muted">
                        {TASK_TYPE_META[selectedQuest.type]?.label ?? 'Задание'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={startQuest}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[20px] px-5 py-3 text-body-sm font-black text-white shadow-[0_12px_28px_rgba(47,47,69,0.16)] transition hover:-translate-y-0.5"
                    style={{ background: meta.color }}
                  >
                    Начать
                    <ChevronRight size={18} strokeWidth={2.8} />
                  </button>
                </>
              )}
            </motion.section>
          </aside>
        </div>
      </div>
    </main>
  );
}
