import { ALL_QUESTS } from './quests';
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

export function saveGameState(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  };

  const badges = getNewBadges(nextState);
  const newBadges = getNewBadgeIds(normalized.badges, badges);
  nextState = {
    ...nextState,
    badges,
  };

  saveGameState(nextState);
  return { state: nextState, newBadges };
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
