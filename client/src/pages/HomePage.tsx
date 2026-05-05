import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Brain,
  BookOpen,
  Camera,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  NotebookPen,
  Sparkles,
  Star,
  Trophy,
  UsersRound,
  Shuffle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Dragon } from '../components/Dragon';
import { getPetMoodFromNeeds } from '../lib/gameState';
import { COMPANION_CATALOG, getCompanionById, getCompanionByNeed } from '../lib/companions';
import { ALL_QUESTS, getDailyQuest, getQuestsByNeedForAge } from '../lib/quests';
import { playTapSound } from '../lib/sfx';
import { filterQuestsByAge, getAgeLabel, getTodayKey } from '../lib/progression';
import type { GameState, NeedType, Quest } from '../types';

interface Props {
  state: GameState;
  onParentView: () => void;
}

type StationId = NeedType | 'daily';

interface StationBase {
  id: StationId;
  badge: string;
  title: string;
  description: string;
  color: string;
  accent: string;
  asset: string;
  aspect: number;
  facts: string[];
  top: string;
  left: string;
}

interface Station extends StationBase {
  featuredQuest: Quest;
  quests: Quest[];
}

const NEED_META: Record<NeedType, { label: string; description: string; icon: string; color: string; accent: string }> = {
  learning: {
    label: 'Знания',
    description: 'Чтение, логика и новые слова',
    icon: 'book',
    color: '#765fde',
    accent: '#ece8ff',
  },
  creative: {
    label: 'Творчество',
    description: 'Рисунки, фото и маленькие открытия',
    icon: 'camera',
    color: '#ff6170',
    accent: '#ffe8ea',
  },
  energy: {
    label: 'Движение',
    description: 'Зарядка, танцы и активные задания',
    icon: 'activity',
    color: '#f0a000',
    accent: '#fff3c8',
  },
};

const STATION_BASE: Record<StationId, StationBase> = {
  learning: {
    id: 'learning',
    badge: 'Обсерватория знаний',
    title: 'Знания',
    description: 'Короткие чтения, задачки и любопытные факты',
    color: '#765fde',
    accent: '#ece8ff',
    asset: '/assets/chars/pirate_blue.png',
    aspect: 374 / 677,
    facts: [
      'Если читать вслух каждый день, слова запоминаются быстрее.',
      'Звёзды бывают разного цвета и температуры.',
    ],
    top: '16%',
    left: '26%',
  },
  creative: {
    id: 'creative',
    badge: 'Мастерская красок',
    title: 'Творчество',
    description: 'Рисунки, фото, поделки и идеи из дома',
    color: '#ff6170',
    accent: '#ffe8ea',
    asset: '/assets/chars/pirate_pink.png',
    aspect: 641 / 447,
    facts: [
      'Когда ты рисуешь, мозг собирает идею почти как карту.',
      'Фотография помогает заметить свет, цвет и форму вокруг.',
    ],
    top: '42%',
    left: '72%',
  },
  daily: {
    id: 'daily',
    badge: 'Задание дня',
    title: 'Сегодняшний маршрут',
    description: 'Особая точка, которая меняется каждый день',
    color: '#3aafff',
    accent: '#e5f5ff',
    asset: '/assets/chars/dino6.png',
    aspect: 1367 / 693,
    facts: [
      'Ежедневное задание помогает не терять ритм и интерес.',
      'Серия растёт, когда ты возвращаешься к занятиям каждый день.',
    ],
    top: '60%',
    left: '28%',
  },
  energy: {
    id: 'energy',
    badge: 'Поляна движения',
    title: 'Движение',
    description: 'Разминка, ритм и задания, где нужно включить тело',
    color: '#f0a000',
    accent: '#fff3c8',
    asset: '/assets/chars/pirate_purple.png',
    aspect: 479 / 413,
    facts: [
      'Короткая разминка помогает мозгу переключаться быстрее.',
      'Баланс тренирует не только ноги, но и внимание.',
    ],
    top: '82%',
    left: '70%',
  },
};

function clampNeedPercent(value: number, maxValue: number): number {
  return Math.max(0, Math.min(100, Math.round((value / maxValue) * 100)));
}

function getNeedIcon(needType: NeedType) {
  if (needType === 'creative') return <Camera size={18} strokeWidth={2.6} />;
  if (needType === 'energy') return <Activity size={18} strokeWidth={2.6} />;
  return <BookOpen size={18} strokeWidth={2.6} />;
}

function getQuestIcon(questType: Quest['type']) {
  if (questType === 'photo') return <Camera size={16} strokeWidth={2.6} />;
  if (questType === 'activity') return <Dumbbell size={16} strokeWidth={2.6} />;
  if (questType === 'quiz') return <Brain size={16} strokeWidth={2.6} />;
  if (questType === 'story') return <NotebookPen size={16} strokeWidth={2.6} />;
  return <BookOpen size={16} strokeWidth={2.6} />;
}

function getQuestTypeLabel(questType: Quest['type']) {
  if (questType === 'photo') return 'Фото';
  if (questType === 'activity') return 'Движение';
  if (questType === 'quiz') return 'Логика';
  if (questType === 'story') return 'История';
  return 'Чтение';
}

function getNeedLabel(type: NeedType) {
  return NEED_META[type].label;
}

function getPetPlacement(station: StationBase) {
  const top = Number.parseFloat(station.top);
  const left = Number.parseFloat(station.left);

  const offsets: Record<StationId, { top: number; left: number }> = {
    learning: { top: 12, left: -11 },
    creative: { top: 12, left: 12 },
    daily: { top: 10, left: -10 },
    energy: { top: -6, left: -10 },
  };

  const offset = offsets[station.id];
  return {
    top: `${Math.max(10, Math.min(90, top + offset.top))}%`,
    left: `${Math.max(10, Math.min(90, left + offset.left))}%`,
  };
}

function getQuestNeedChip(quest: Quest) {
  return NEED_META[quest.needType];
}

export function HomePage({ state, onParentView }: Props) {
  const navigate = useNavigate();
  const mood = getPetMoodFromNeeds(state.needs);
  const completedToday = state.completedQuestsToday.length;
  const totalTodayXp = state.completedQuestsToday.reduce((sum, quest) => sum + quest.xpEarned, 0);
  const journalEntries = [...state.completedQuestsToday].slice(-3).reverse();
  const recentGifts = state.giftCollection.slice(0, 4);
  const completedQuestIds = useMemo(
    () => new Set(state.completedQuestsToday.map(quest => quest.questId)),
    [state.completedQuestsToday],
  );

  const learningQuests = useMemo(() => getQuestsByNeedForAge('learning', state.ageGroup), [state.ageGroup]);
  const creativeQuests = useMemo(() => getQuestsByNeedForAge('creative', state.ageGroup), [state.ageGroup]);
  const energyQuests = useMemo(() => getQuestsByNeedForAge('energy', state.ageGroup), [state.ageGroup]);
  const dailyQuest = useMemo(() => getDailyQuest(state.ageGroup, getTodayKey()), [state.ageGroup]);
  const ageQuests = useMemo(() => filterQuestsByAge(ALL_QUESTS, state.ageGroup), [state.ageGroup]);

  const featuredQuest = dailyQuest ?? learningQuests[0] ?? creativeQuests[0] ?? energyQuests[0] ?? ALL_QUESTS[0];

  const stations = useMemo<Station[]>(() => {
    const makeStation = (base: StationBase, featured: Quest, quests: Quest[]): Station => ({
      ...base,
      featuredQuest: featured,
      quests,
    });

    return [
      makeStation(STATION_BASE.learning, learningQuests[0] ?? featuredQuest, learningQuests.slice(1, 4)),
      makeStation(STATION_BASE.creative, creativeQuests[0] ?? featuredQuest, creativeQuests.slice(1, 4)),
      makeStation(STATION_BASE.daily, featuredQuest, [
        ...(learningQuests.slice(0, 1) ?? []),
        ...(creativeQuests.slice(0, 1) ?? []),
      ].filter(Boolean) as Quest[]),
      makeStation(STATION_BASE.energy, energyQuests[0] ?? featuredQuest, energyQuests.slice(1, 4)),
    ];
  }, [creativeQuests, energyQuests, featuredQuest, learningQuests]);

  const questToStation = useMemo(() => {
    const map = new Map<string, StationId>();
    stations.forEach(station => {
      map.set(station.featuredQuest.id, station.id);
      station.quests.forEach(quest => map.set(quest.id, station.id));
    });
    return map;
  }, [stations]);

  const quickQuests = useMemo(() => {
    const pool = [
      ...learningQuests.slice(0, 3),
      ...creativeQuests.slice(0, 3),
      ...energyQuests.slice(0, 3),
      featuredQuest,
    ];
    const unique = new Map<string, Quest>();
    pool.forEach(quest => unique.set(quest.id, quest));
    return Array.from(unique.values()).slice(0, 10);
  }, [creativeQuests, energyQuests, featuredQuest, learningQuests]);

  const dailyRoute = useMemo(() => {
    const route: Quest[] = [];
    const used = new Set<string>();
    const pools = [
      learningQuests,
      creativeQuests,
      energyQuests,
    ];

    pools.forEach(pool => {
      const pick = pool.find(quest => !completedQuestIds.has(quest.id)) ?? pool[0];
      if (pick && !used.has(pick.id)) {
        route.push(pick);
        used.add(pick.id);
      }
    });

    if (dailyQuest && !used.has(dailyQuest.id)) {
      route.unshift(dailyQuest);
      used.add(dailyQuest.id);
    }

    return route.slice(0, 4);
  }, [completedQuestIds, creativeQuests, dailyQuest, energyQuests, learningQuests]);

  const surprisePool = useMemo(() => {
    const routeIds = new Set(dailyRoute.map(quest => quest.id));
    const pool = ageQuests.filter(quest => !completedQuestIds.has(quest.id) && !routeIds.has(quest.id));
    return pool.length > 0 ? pool : ageQuests;
  }, [ageQuests, completedQuestIds, dailyRoute]);

  const [selectedStationId, setSelectedStationId] = useState<StationId>(dailyQuest ? 'daily' : 'learning');
  const [selectedQuestId, setSelectedQuestId] = useState(featuredQuest.id);
  const [factStep, setFactStep] = useState(0);
  const [selectedCompanionId, setSelectedCompanionId] = useState<string>(dailyQuest ? 'daily' : 'learning');
  const [companionFactStep, setCompanionFactStep] = useState(0);
  const [surpriseIndex, setSurpriseIndex] = useState(0);

  const selectedStation = stations.find(station => station.id === selectedStationId) ?? stations[0];
  const selectedQuest = quickQuests.find(quest => quest.id === selectedQuestId)
    ?? stations.flatMap(station => [station.featuredQuest, ...station.quests]).find(quest => quest.id === selectedQuestId)
    ?? featuredQuest;
  const surpriseQuest = surprisePool[surpriseIndex % surprisePool.length] ?? dailyRoute[0] ?? featuredQuest;
  const selectedCompanion = getCompanionById(selectedCompanionId);
  const rewardCompanion = getCompanionByNeed(selectedQuest.needType);
  const selectedSceneSrc =
    selectedStation.id === 'creative'
      ? '/assets/scenes/reading2.png'
      : selectedStation.id === 'energy'
        ? '/assets/scenes/reading3.png'
        : '/assets/scenes/reading1.png';

  function selectStation(stationId: StationId) {
    const station = stations.find(item => item.id === stationId);
    if (!station) return;
    playTapSound();
    setSelectedStationId(stationId);
    setSelectedQuestId(station.featuredQuest.id);
    setSelectedCompanionId(stationId);
    setCompanionFactStep(0);
  }

  function selectQuest(quest: Quest) {
    playTapSound();
    const stationId = questToStation.get(quest.id);
    if (stationId) {
      setSelectedStationId(stationId);
      setSelectedCompanionId(stationId);
    }
    setSelectedQuestId(quest.id);
    setCompanionFactStep(0);
  }

  function selectCompanion(companionId: string) {
    const companion = COMPANION_CATALOG.find(item => item.id === companionId);
    if (!companion) return;
    playTapSound();
    setSelectedCompanionId(companionId);
    setCompanionFactStep(0);
    if (companion.stationId) {
      setSelectedStationId(companion.stationId);
      const station = stations.find(item => item.id === companion.stationId);
      if (station) setSelectedQuestId(station.featuredQuest.id);
    }
  }

  function startQuest() {
    playTapSound();
    navigate(`/task/${selectedQuest.type}/${selectedQuest.id}`);
  }

  function startSpecificQuest(quest: Quest) {
    playTapSound();
    const stationId = questToStation.get(quest.id);
    if (stationId) {
      setSelectedStationId(stationId);
      setSelectedCompanionId(stationId);
    }
    setSelectedQuestId(quest.id);
    navigate(`/task/${quest.type}/${quest.id}`);
  }

  useEffect(() => {
    setSurpriseIndex(0);
  }, [dailyRoute, state.ageGroup]);

  return (
    <main className="app-page relative overflow-hidden bg-[#e8f8ff] text-text">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,255,255,0.82),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.55),transparent_26%),linear-gradient(180deg,#eaf8ff_0%,#f8fcff_24%,#eef9e6_70%,#d6ebb6_100%)]" />

      <div className="page-shell relative z-10 py-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.18fr)_390px] lg:items-start">
          <div className="min-w-0 space-y-4">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-[34px] p-5 sm:p-6"
            >
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0">
                  <div className="map-title-chip w-fit bg-white/85">
                    <Sparkles size={14} />
                    Карта приключений
                  </div>
                  <h1 className="mt-3 font-display text-h2 font-black text-text sm:text-h1">
                    {state.childName || 'Игрок'}, выбери задание
                  </h1>
                  <p className="mt-3 max-w-2xl text-body-md font-semibold text-text-muted">
                    Нажми на место на карте или начни план на сегодня. После задания Дракоша подарит подарок.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className="soft-chip bg-white/90"
                      style={{ color: selectedStation.color }}
                    >
                      <MapPin size={13} />
                      {selectedStation.badge}
                    </span>
                    <span className="soft-chip bg-white/90 text-text-muted">
                      <CalendarDays size={13} />
                      {getAgeLabel(state.ageGroup)}
                    </span>
                    <span className="soft-chip bg-white/90 text-text-muted">
                      <Heart size={13} />
                      {mood === 'excited' ? 'очень бодрый' : mood === 'happy' ? 'весёлый' : mood === 'sad' ? 'нужно подбодрить' : 'спокойный'}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                      '1. Выбери место',
                      '2. Начни задание',
                      '3. Забери подарок',
                    ].map(step => (
                      <div key={step} className="rounded-[18px] bg-white/88 px-4 py-3 text-caption font-black text-text-muted shadow-[0_8px_18px_rgba(47,47,69,0.06)]">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/70 bg-white/96 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.1)]">
                  <div className="overflow-hidden rounded-[22px] border border-white/70 shadow-[0_10px_24px_rgba(47,47,69,0.08)]">
                    <img src={selectedSceneSrc} alt="" className="h-24 w-full object-cover" />
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary text-white">
                      <Sparkles size={26} strokeWidth={2.6} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Питомец</p>
                      <h2 className="truncate font-display text-h4 font-black text-text">{state.pet.name}</h2>
                      <p className="text-caption font-black text-primary">Уровень {state.pet.level}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-[22px] bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-caption font-black text-text-muted">XP</span>
                      <span className="text-caption font-black text-primary">{state.pet.xp}/{state.pet.xpToNext}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-primary-light">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${clampNeedPercent(state.pet.xp, state.pet.xpToNext)}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-[18px] bg-[#fff3c8]/95 p-3 text-center">
                      <Trophy className="mx-auto text-[#a36a00]" size={18} />
                      <div className="mt-2 text-body-sm font-black text-[#875900]">{state.streak}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.06em] text-text-muted">серия</div>
                    </div>
                    <div className="rounded-[18px] bg-[#e5f5ff]/95 p-3 text-center">
                      <Star className="mx-auto text-blue" size={18} />
                      <div className="mt-2 text-body-sm font-black text-blue">{completedToday}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.06em] text-text-muted">сегодня</div>
                    </div>
                    <div className="rounded-[18px] bg-[#ffe8ea]/95 p-3 text-center">
                      <Sparkles className="mx-auto text-brand" size={18} />
                      <div className="mt-2 text-body-sm font-black text-brand">{totalTodayXp}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.06em] text-text-muted">XP</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            <section className="grid gap-3 sm:grid-cols-3">
              {state.needs.map(need => {
                const needMeta = NEED_META[need.type];
                const isSelected = selectedStation.id === need.type;
                return (
                  <button
                    key={need.type}
                    type="button"
                    onClick={() => selectStation(need.type)}
                    className={`rounded-[24px] border p-4 text-left transition ${
                      isSelected ? 'border-primary/30 bg-white shadow-[0_18px_36px_rgba(47,47,69,0.14)]' : 'border-white/60 bg-white/96 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
                        style={{ background: needMeta.accent, color: needMeta.color }}
                      >
                        {getNeedIcon(need.type)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-body-sm font-black text-text">{need.label}</p>
                        <p className="text-[12px] font-semibold text-text-muted">{needMeta.description}</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${clampNeedPercent(need.value, need.maxValue)}%`, background: need.color }}
                      />
                    </div>
                  </button>
                );
              })}
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="glass-panel rounded-[30px] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-h4 font-black text-text">План на сегодня</h2>
                    <p className="text-body-sm font-semibold text-text-muted">
                      Сделай несколько разных заданий и собери больше подарков.
                    </p>
                  </div>
                  <span className="soft-chip bg-white/90 text-primary">
                    <MapPin size={13} />
                    3 шага
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  {dailyRoute.map((quest, index) => {
                    const meta = getQuestNeedChip(quest);
                    return (
                      <button
                        key={quest.id}
                        type="button"
                        onClick={() => startSpecificQuest(quest)}
                        className="rounded-[24px] border border-white/70 bg-white/96 p-4 text-left shadow-[0_12px_24px_rgba(47,47,69,0.06)] transition hover:-translate-y-0.5"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
                            style={{ background: meta.accent, color: meta.color }}
                          >
                            {getQuestIcon(quest.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black"
                                style={{ background: meta.accent, color: meta.color }}
                              >
                                {index + 1} шаг
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-black text-text-muted">
                                {getQuestTypeLabel(quest.type)}
                              </span>
                            </div>
                            <h3 className="truncate text-body-sm font-black text-text">{quest.title}</h3>
                            <p className="mt-1 text-[13px] font-semibold leading-snug text-text-muted">
                              {quest.description}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className="text-caption font-black text-text-muted">{quest.xpReward} XP</span>
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-caption font-black text-white"
                              style={{ background: meta.color }}
                            >
                              Начать
                              <ChevronRight size={14} strokeWidth={3} />
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="glass-panel rounded-[30px] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-h4 font-black text-text">Случайное задание</h2>
                    <p className="text-body-sm font-semibold text-text-muted">
                      Не знаешь, что выбрать? Дракоша выбрал задание за тебя.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSurpriseIndex(step => step + 1)}
                    className="soft-chip bg-white/90 text-text-muted"
                  >
                    <Shuffle size={13} />
                    Сменить
                  </button>
                </div>

                <div className="mt-4 rounded-[28px] border border-white/70 bg-gradient-to-br from-white/95 via-[#f4fbff] to-[#edf9e7] p-4 shadow-[0_14px_28px_rgba(47,47,69,0.08)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#edeaff] text-primary">
                      <Sparkles size={26} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Дракоша выбрал</p>
                      <h3 className="truncate font-display text-h4 font-black text-text">{surpriseQuest.title}</h3>
                      <p className="text-caption font-black text-primary">+{surpriseQuest.xpReward} XP</p>
                    </div>
                  </div>
                  <p className="mt-3 text-body-sm font-semibold leading-snug text-text-muted">
                    {surpriseQuest.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black"
                      style={{ background: NEED_META[surpriseQuest.needType].accent, color: NEED_META[surpriseQuest.needType].color }}
                    >
                      {getNeedLabel(surpriseQuest.needType)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-black text-text-muted">
                      {getQuestTypeLabel(surpriseQuest.type)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-black text-text-muted">
                      {completedQuestIds.has(surpriseQuest.id) ? 'Уже сделал сегодня' : 'Можно начинать'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => startSpecificQuest(surpriseQuest)}
                    className="btn-primary mt-4 w-full"
                  >
                    Начать сюрприз
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-h4 font-black text-text">Другие задания</h2>
                <span className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">
                  {quickQuests.length} вариантов
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {quickQuests.map(quest => {
                  const isActive = selectedQuest.id === quest.id;
                  const needMeta = NEED_META[quest.needType];
                  return (
                    <button
                      key={quest.id}
                      type="button"
                      onClick={() => selectQuest(quest)}
                      className={`rounded-[24px] border p-4 text-left transition ${
                        isActive ? 'border-primary/30 bg-white shadow-[0_18px_36px_rgba(47,47,69,0.14)]' : 'border-white/60 bg-white/96 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
                          style={{ background: needMeta.accent, color: needMeta.color }}
                        >
                          {getQuestIcon(quest.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black"
                              style={{ background: needMeta.accent, color: needMeta.color }}
                            >
                              {getNeedLabel(quest.needType)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-black text-text-muted">
                              {getQuestTypeLabel(quest.type)}
                            </span>
                          </div>
                          <h3 className="truncate text-body-sm font-black text-text">{quest.title}</h3>
                          <p className="mt-1 max-h-[2.9rem] overflow-hidden text-[13px] font-semibold leading-snug text-text-muted">
                            {quest.description}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-caption font-black text-text-muted">{quest.xpReward} XP</span>
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-caption font-black text-white"
                              style={{ background: needMeta.color }}
                            >
                              Выбрать
                              <ChevronRight size={14} strokeWidth={3} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="glass-panel rounded-[30px] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-h4 font-black text-text">Что уже сделано</h2>
                    <p className="text-body-sm font-semibold text-text-muted">
                      Здесь появляются задания, которые ты уже закончил.
                    </p>
                  </div>
                  <span className="soft-chip bg-white/90 text-text-muted">
                    <CalendarDays size={13} />
                    {completedToday} записи
                  </span>
                </div>

                {journalEntries.length > 0 ? (
                  <div className="mt-4 grid gap-3">
                    {journalEntries.map(entry => (
                      <div key={`${entry.questId}-${entry.completedAt}`} className="rounded-[22px] bg-white/95 p-4 shadow-[0_12px_24px_rgba(47,47,69,0.06)]">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-11 w-11 items-center justify-center rounded-[16px]"
                            style={{ background: NEED_META[entry.needType].accent, color: NEED_META[entry.needType].color }}
                          >
                            {getQuestIcon(entry.taskType)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-body-sm font-black text-text">{entry.title}</p>
                            <p className="text-caption font-semibold text-text-muted">
                              {new Date(entry.completedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · +{entry.xpEarned} XP
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[24px] border border-dashed border-white/80 bg-white/80 p-5 text-body-sm font-semibold text-text-muted">
                    Пока пусто. После первого задания тут появится запись.
                  </div>
                )}
              </div>

              <div className="glass-panel rounded-[30px] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-h4 font-black text-text">Мои подарки</h2>
                    <p className="text-body-sm font-semibold text-text-muted">
                      Друзья Дракоши дарят их после заданий.
                    </p>
                  </div>
                  <span className="soft-chip bg-white/90 text-primary">
                    <Gift size={13} />
                    {recentGifts.length}
                  </span>
                </div>

                {recentGifts.length > 0 ? (
                  <div className="mt-4 grid gap-2">
                    {recentGifts.map(gift => {
                      const companion = getCompanionById(gift.companionId);
                      return (
                        <div key={`${gift.companionId}-${gift.questId}`} className="rounded-[22px] bg-white/95 p-4 shadow-[0_12px_24px_rgba(47,47,69,0.06)]">
                          <p className="text-caption font-black uppercase tracking-[0.08em]" style={{ color: companion.color }}>
                            {gift.companionName}
                          </p>
                          <p className="mt-1 text-body-sm font-black text-text">{gift.gift}</p>
                          <p className="mt-1 text-caption font-semibold text-text-muted">{gift.questTitle}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[24px] border border-dashed border-white/80 bg-white/80 p-5 text-body-sm font-semibold text-text-muted">
                    Сделай задание, и здесь появится первый подарок.
                  </div>
                )}
              </div>
            </section>

            <section className="glass-panel rounded-[30px] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-h4 font-black text-text">Друзья Дракоши</h2>
                  <p className="text-body-sm font-semibold text-text-muted">
                    Они помогают на карте и дарят подарки.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid auto-rows-fr items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {COMPANION_CATALOG.filter(companion => companion.id !== 'daily').map(companion => {
                  const isSelected = selectedCompanion.id === companion.id;
                  return (
                    <button
                      key={companion.id}
                      type="button"
                      onClick={() => selectCompanion(companion.id)}
                      className={`flex h-full min-h-[140px] flex-col justify-between rounded-[24px] border p-3 text-left transition ${
                        isSelected ? 'border-primary/30 bg-white shadow-[0_18px_36px_rgba(47,47,69,0.14)]' : 'border-white/60 bg-white/96 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px]"
                          style={{ background: companion.accent }}
                        >
                          <img src={companion.asset} alt={companion.name} className="h-full w-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-[0.08em]" style={{ color: companion.color }}>
                            {companion.name}
                          </p>
                          <h3 className="truncate text-body-sm font-black text-text">{companion.role}</h3>
                          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.06em] text-text-muted">
                            {companion.tag}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-caption font-black text-text-muted">Подарок</span>
                        <span className="soft-chip bg-white/90 text-primary">
                          <Gift size={12} />
                          {companion.gift}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[32px] border border-white/70 bg-white/96 p-5 shadow-[0_12px_28px_rgba(47,47,69,0.1)]">
                <div className="grid gap-5 lg:grid-cols-[320px_1fr] lg:items-center">
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px]"
                      style={{ background: selectedCompanion.accent }}
                    >
                      <img
                        src={selectedCompanion.asset}
                        alt={selectedCompanion.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-black"
                          style={{ background: selectedCompanion.accent, color: selectedCompanion.color }}
                        >
                          {selectedCompanion.name}
                        </span>
                        <span className="text-caption font-black text-text-muted">{selectedCompanion.role}</span>
                        <span className="soft-chip bg-white/90 text-text-muted">
                          {selectedCompanion.stationId ? 'Станция' : 'Гость'}
                        </span>
                      </div>
                      <p className="text-body-sm font-semibold leading-snug text-text-muted">
                        {selectedCompanion.facts[companionFactStep % selectedCompanion.facts.length]}
                      </p>
                      <div className="mt-3 rounded-[20px] bg-white/92 p-3">
                        <div className="flex items-center gap-2 text-caption font-black uppercase tracking-[0.08em] text-text-muted">
                          <Gift size={13} />
                          Подарок после задания
                        </div>
                        <p className="mt-2 text-body-sm font-black text-text">
                          {rewardCompanion.name} принесёт {rewardCompanion.gift}.
                        </p>
                        <p className="mt-1 text-[12px] font-semibold leading-snug text-text-muted">
                          Сделай выбранное задание, и подарок откроется на экране награды.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setCompanionFactStep(step => step + 1)}
                      className="inline-flex items-center gap-2 rounded-[20px] px-4 py-3 text-body-sm font-black text-white shadow-[0_12px_28px_rgba(47,47,69,0.16)] transition hover:-translate-y-0.5"
                      style={{ background: selectedCompanion.color }}
                    >
                      <MessageCircle size={18} strokeWidth={2.6} />
                      Ещё факт
                    </button>
                    <div className="rounded-[20px] border border-dashed border-primary/20 bg-[#edeaff] px-4 py-3 text-body-sm font-black text-primary">
                      Подарок откроется после выполнения задания.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4">
            <motion.section
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="map-shell overflow-hidden rounded-[34px]"
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="map-title-chip w-fit bg-white/85">
                      <MapPin size={14} />
                      Карта
                    </div>
                    <p className="mt-2 text-body-sm font-semibold text-text-muted">
                      Нажми на место, чтобы выбрать задание.
                    </p>
                  </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onParentView}
                    className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-caption font-black text-primary shadow-[0_8px_18px_rgba(47,47,69,0.08)]"
                  >
                    <UsersRound size={14} strokeWidth={2.6} />
                    Родителям
                  </button>
                </div>
                </div>
              </div>

              <div className="relative min-h-[600px] overflow-hidden border-t border-white/50 bg-[radial-gradient(circle_at_20%_14%,rgba(255,255,255,0.96),transparent_24%),linear-gradient(180deg,rgba(205,239,255,0.94)_0%,rgba(233,248,255,0.9)_24%,rgba(235,248,228,0.92)_62%,rgba(191,222,147,0.96)_100%)]">
                <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 430 600" preserveAspectRatio="none">
                  <path
                    d="M 310 78 C 242 118, 176 158, 162 232 C 151 302, 242 344, 280 406 C 309 454, 272 516, 204 552"
                    fill="none"
                    stroke="rgba(255,247,209,0.88)"
                    strokeLinecap="round"
                    strokeWidth="30"
                  />
                  <path
                    d="M 310 78 C 242 118, 176 158, 162 232 C 151 302, 242 344, 280 406 C 309 454, 272 516, 204 552"
                    fill="none"
                    stroke="rgba(255,255,255,0.78)"
                    strokeLinecap="round"
                    strokeDasharray="10 18"
                    strokeWidth="5"
                  />
                </svg>

                <motion.div
                  key={selectedStation.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 170, damping: 18 }}
                  className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
                  style={getPetPlacement(selectedStation)}
                >
                  <div className="scale-90 origin-bottom">
                    <Dragon mood={mood} level={state.pet.level} size="sm" />
                  </div>
                </motion.div>

                {stations.map(station => {
                  const isActive = selectedStation.id === station.id;
                  return (
                    <button
                      key={station.id}
                      type="button"
                      onClick={() => selectStation(station.id)}
                      className={`map-node absolute z-20 w-[190px] -translate-x-1/2 -translate-y-1/2 border text-left ${
                        isActive ? 'border-white bg-white/98 shadow-[0_18px_40px_rgba(47,47,69,0.18)]' : 'border-white/70 bg-white/96'
                      }`}
                      style={{ top: station.top, left: station.left }}
                    >
                      <div className="flex items-center gap-3 p-4">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
                          style={{ background: station.accent, color: station.color }}
                        >
                          {station.id === 'creative' ? (
                            <Camera size={22} strokeWidth={2.5} />
                          ) : station.id === 'energy' ? (
                            <Activity size={22} strokeWidth={2.5} />
                          ) : station.id === 'daily' ? (
                            <Star size={22} strokeWidth={2.5} />
                          ) : (
                            <BookOpen size={22} strokeWidth={2.5} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-[0.08em]" style={{ color: station.color }}>
                            {station.badge}
                          </p>
                          <h3 className="truncate text-body-sm font-black text-text">{station.featuredQuest.title}</h3>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-[30px] p-4 sm:p-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px]"
                  style={{ background: selectedStation.accent }}
                >
                  <img
                    src={selectedStation.asset}
                    alt={selectedStation.badge}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">
                    {selectedStation.badge}
                  </p>
                  <h2 className="truncate font-display text-h4 font-black text-text">{selectedQuest.title}</h2>
                  <p className="text-caption font-black text-primary">+{selectedQuest.xpReward} XP</p>
                </div>
              </div>
              <p className="mt-3 text-body-sm font-semibold leading-snug text-text-muted">
                {selectedQuest.description}
              </p>
              <p className="mt-3 rounded-[22px] bg-white/94 p-4 text-body-sm font-black text-text shadow-[0_10px_24px_rgba(47,47,69,0.08)]">
                {selectedStation.facts[factStep % selectedStation.facts.length]}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFactStep(step => step + 1)}
                  className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary-light text-primary transition hover:-translate-y-0.5"
                  aria-label="Сменить факт"
                  title="Сменить факт"
                >
                  <MessageCircle size={20} strokeWidth={2.6} />
                </button>
                <button
                  type="button"
                  onClick={startQuest}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[20px] px-5 py-3 text-body-sm font-black text-white shadow-[0_12px_28px_rgba(47,47,69,0.16)] transition hover:-translate-y-0.5"
                  style={{ background: selectedStation.color }}
                >
                  Начать задание
                  <ChevronRight size={18} strokeWidth={2.8} />
                </button>
              </div>
            </motion.section>
          </aside>
        </div>
      </div>
    </main>
  );
}
