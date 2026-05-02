import { ALL_QUESTS } from './quests';
import { getCompanionByNeed } from './companions';
import {
  createQuestTypeCounts,
  getDailyQuestForAge,
  getNewBadgeIds,
  getNewBadges,
  getTodayKey,
  mergeQuestTypeCounts,
} from './progression';
import type {
  BadgeId,
  CompletedQuest,
  GameState,
  GiftRecord,
  NeedType,
  Quest,
  TaskType,
} from '../types';

const STORAGE_KEY = 'drakosha_game_state';
const LAST_VISIT_KEY = 'drakosha_last_visit';

const DEFAULT_STATE: GameState = {
  pet: {
    name: 'Дракоша',
    level: 1,
    xp: 0,
    xpToNext: 100,
    mood: 'happy',
  },
  needs: [
    { type: 'learning', label: 'Знания', emoji: '📚', color: '#765fde', value: 40, maxValue: 100 },
    { type: 'creative', label: 'Творчество', emoji: '🎨', color: '#ff6170', value: 30, maxValue: 100 },
    { type: 'energy', label: 'Энергия', emoji: '⚡', color: '#fbcc3c', value: 50, maxValue: 100 },
  ],
  currentSession: null,
  completedQuestsToday: [],
  childName: '',
  ageGroup: '6-8',
  dailyProgressDate: getTodayKey(),
  lastActivityDate: null,
  streak: 0,
  lifetimeQuestsCompleted: 0,
  lifetimeXpEarned: 0,
  questTypeCounts: createQuestTypeCounts(),
  badges: [],
  giftCollection: [],
};

function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayDiff(fromKey: string, toKey: string): number {
  const [fromYear, fromMonth, fromDay] = fromKey.split('-').map(Number);
  const [toYear, toMonth, toDay] = toKey.split('-').map(Number);
  const from = new Date(fromYear, fromMonth - 1, fromDay);
  const to = new Date(toYear, toMonth - 1, toDay);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

function normalizeCompletedQuest(quest: CompletedQuest): CompletedQuest {
  if (quest.needType) return quest;
  const meta = ALL_QUESTS.find(item => item.id === quest.questId);
  return {
    ...quest,
    needType: meta?.needType ?? 'learning',
  };
}

function normalizeDailyQuests(quests: CompletedQuest[], today: string): CompletedQuest[] {
  const normalized = quests.map(normalizeCompletedQuest);
  if (normalized.length === 0) return normalized;

  const everyQuestIsToday = normalized.every(quest => toDayKey(new Date(quest.completedAt)) === today);
  return everyQuestIsToday ? normalized : [];
}

function normalizeGiftCollection(gifts: GiftRecord[] | undefined): GiftRecord[] {
  if (!Array.isArray(gifts)) return [];

  const latestByCompanion = new Map<string, GiftRecord>();
  gifts.forEach(gift => {
    if (!gift?.companionId) return;
    const existing = latestByCompanion.get(gift.companionId);
    const currentTime = Number.isFinite(Date.parse(gift.collectedAt)) ? Date.parse(gift.collectedAt) : 0;
    const existingTime = existing && Number.isFinite(Date.parse(existing.collectedAt)) ? Date.parse(existing.collectedAt) : 0;
    if (!existing || currentTime >= existingTime) {
      latestByCompanion.set(gift.companionId, gift);
    }
  });

  return Array.from(latestByCompanion.values()).sort(
    (a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime(),
  );
}

function normalizeGameState(saved: Partial<GameState> = {}): GameState {
  const today = getTodayKey();
  const base: GameState = {
    ...DEFAULT_STATE,
    ...saved,
    pet: {
      ...DEFAULT_STATE.pet,
      ...saved.pet,
    },
    needs: DEFAULT_STATE.needs.map(defaultNeed => {
      const savedNeed = saved.needs?.find(need => need.type === defaultNeed.type);
      return {
        ...defaultNeed,
        ...savedNeed,
      };
    }),
    currentSession: saved.currentSession ?? null,
    childName: saved.childName ?? '',
    ageGroup: saved.ageGroup ?? DEFAULT_STATE.ageGroup,
    dailyProgressDate: saved.dailyProgressDate ?? today,
    lastActivityDate: saved.lastActivityDate ?? null,
    streak: typeof saved.streak === 'number' ? saved.streak : 0,
    lifetimeQuestsCompleted: typeof saved.lifetimeQuestsCompleted === 'number' ? saved.lifetimeQuestsCompleted : 0,
    lifetimeXpEarned: typeof saved.lifetimeXpEarned === 'number' ? saved.lifetimeXpEarned : 0,
    questTypeCounts: mergeQuestTypeCounts(saved.questTypeCounts as Partial<GameState['questTypeCounts']> | undefined),
    badges: Array.isArray(saved.badges) ? [...new Set(saved.badges as BadgeId[])] : [],
    giftCollection: normalizeGiftCollection(saved.giftCollection as GiftRecord[] | undefined),
    completedQuestsToday: [],
  };

  base.completedQuestsToday = normalizeDailyQuests(
    (saved.completedQuestsToday as CompletedQuest[] | undefined) ?? [],
    today,
  );

  if (base.lastActivityDate && dayDiff(base.lastActivityDate, today) > 1) {
    base.streak = 0;
  }

  if (base.dailyProgressDate !== today) {
    base.completedQuestsToday = [];
    base.dailyProgressDate = today;
  }

  return base;
}

export function loadGameState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeGameState();
    const saved = JSON.parse(raw) as Partial<GameState>;
    return normalizeGameState(saved);
  } catch {
    return normalizeGameState();
  }
}

export function createDemoGameState(): GameState {
  const today = getTodayKey();

  return normalizeGameState({
    pet: {
      name: 'Дракоша',
      level: 3,
      xp: 65,
      xpToNext: 144,
      mood: 'excited',
    },
    needs: [
      { type: 'learning', label: 'Знания', emoji: '📚', color: '#765fde', value: 76, maxValue: 100 },
      { type: 'creative', label: 'Творчество', emoji: '🎨', color: '#ff6170', value: 68, maxValue: 100 },
      { type: 'energy', label: 'Энергия', emoji: '⚡', color: '#fbcc3c', value: 82, maxValue: 100 },
    ],
    childName: 'Алиса',
    ageGroup: '6-8',
    dailyProgressDate: today,
    lastActivityDate: today,
    streak: 4,
    lifetimeQuestsCompleted: 9,
    lifetimeXpEarned: 285,
    questTypeCounts: {
      reading: 2,
      story: 2,
      photo: 2,
      activity: 2,
      quiz: 1,
    },
    badges: ['first_quest', 'streak_3'],
    giftCollection: [
      {
        companionId: 'learning',
        companionName: 'Пират Блу',
        gift: 'Синяя звезда',
        questId: 'read_2',
        questTitle: 'История о дружбе',
        needType: 'learning',
        collectedAt: new Date().toISOString(),
      },
      {
        companionId: 'creative',
        companionName: 'Пинки',
        gift: 'Радужный набор',
        questId: 'draw_1',
        questTitle: 'Нарисуй дракона',
        needType: 'creative',
        collectedAt: new Date().toISOString(),
      },
    ],
    completedQuestsToday: [
      {
        questId: 'read-friendship',
        completedAt: new Date().toISOString(),
        xpEarned: 35,
        taskType: 'reading',
        needType: 'learning',
        title: 'История о дружбе',
      },
    ],
  });
}

export function saveGameState(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_VISIT_KEY);
  } catch {
    // ignore storage errors
  }
}

export function addXP(state: GameState, amount: number): GameState {
  let { pet } = state;
  let newXP = pet.xp + amount;
  let level = pet.level;
  let xpToNext = pet.xpToNext;

  while (newXP >= xpToNext) {
    newXP -= xpToNext;
    level += 1;
    xpToNext = Math.floor(100 * Math.pow(1.2, level - 1));
  }

  return {
    ...state,
    pet: { ...pet, xp: newXP, level, xpToNext, mood: 'excited' },
  };
}

export function fillNeed(state: GameState, needType: string, amount = 25): GameState {
  return {
    ...state,
    needs: state.needs.map(n =>
      n.type === needType
        ? { ...n, value: Math.min(n.maxValue, n.value + amount) }
        : n
    ),
  };
}

interface QuestLike {
  id: string;
  xpReward: number;
  needType: NeedType;
  type: TaskType;
  title: string;
}

export interface QuestCompletionResult {
  state: GameState;
  newBadges: BadgeId[];
  newGift: GiftRecord | null;
}

export function completeQuest(
  state: GameState,
  quest: QuestLike,
  photoUrl?: string,
): QuestCompletionResult {
  const today = getTodayKey();
  const normalized = normalizeGameState(state);

  const completed: CompletedQuest = {
    questId: quest.id,
    completedAt: new Date().toISOString(),
    photoUrl,
    xpEarned: quest.xpReward,
    taskType: quest.type,
    needType: quest.needType,
    title: quest.title,
  };

  const questTypeCounts = {
    ...normalized.questTypeCounts,
    [quest.type]: normalized.questTypeCounts[quest.type] + 1,
  };

  const giftCompanion = getCompanionByNeed(quest.needType);
  const nextGift: GiftRecord = {
    companionId: giftCompanion.id,
    companionName: giftCompanion.name,
    gift: giftCompanion.gift,
    questId: quest.id,
    questTitle: quest.title,
    needType: quest.needType,
    collectedAt: new Date().toISOString(),
  };
  const existingGiftIndex = normalized.giftCollection.findIndex(item => item.companionId === giftCompanion.id);
  const giftCollection =
    existingGiftIndex >= 0
      ? normalized.giftCollection.map(item => item.companionId === giftCompanion.id ? nextGift : item)
      : [nextGift, ...normalized.giftCollection];

  const nextCompletedQuests =
    normalized.dailyProgressDate === today
      ? [...normalized.completedQuestsToday, completed]
      : [completed];

  let streak = 1;
  if (normalized.lastActivityDate === today) {
    streak = normalized.streak;
  } else if (normalized.lastActivityDate && dayDiff(normalized.lastActivityDate, today) === 1) {
    streak = normalized.streak + 1;
  }

  let nextState: GameState = {
    ...addXP(normalized, quest.xpReward),
    needs: fillNeed(normalized, quest.needType).needs,
    completedQuestsToday: nextCompletedQuests,
    dailyProgressDate: today,
    lastActivityDate: today,
    streak,
    lifetimeQuestsCompleted: normalized.lifetimeQuestsCompleted + 1,
    lifetimeXpEarned: normalized.lifetimeXpEarned + quest.xpReward,
    questTypeCounts,
    giftCollection,
  };

  const badges = getNewBadges(nextState);
  const newBadges = getNewBadgeIds(normalized.badges, badges);
  nextState = {
    ...nextState,
    badges,
  };

  saveGameState(nextState);
  return {
    state: nextState,
    newBadges,
    newGift: existingGiftIndex >= 0 ? null : nextGift,
  };
}

export function getPetMoodFromNeeds(needs: GameState['needs']): GameState['pet']['mood'] {
  const avg = needs.reduce((s, n) => s + n.value / n.maxValue, 0) / needs.length;
  if (avg >= 0.7) return 'excited';
  if (avg >= 0.4) return 'happy';
  if (avg >= 0.2) return 'neutral';
  return 'sad';
}

export function decayNeeds(state: GameState): GameState {
  const last = localStorage.getItem(LAST_VISIT_KEY);
  const now = Date.now();
  localStorage.setItem(LAST_VISIT_KEY, String(now));
  if (!last) return state;
  const hoursPassed = (now - Number(last)) / 3600000;
  if (hoursPassed < 1) return state;
  const decay = Math.min(30, Math.floor(hoursPassed * 5));
  return {
    ...state,
    needs: state.needs.map(n => ({ ...n, value: Math.max(0, n.value - decay) })),
  };
}

export function getDailyQuestFromState(state: GameState): Quest | undefined {
  const today = getTodayKey();
  const normalized = normalizeGameState(state);
  return getDailyQuestForAge(ALL_QUESTS, normalized.ageGroup, today);
}
