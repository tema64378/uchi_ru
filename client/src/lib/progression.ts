import type { AgeGroup, BadgeId, GameState, Quest, QuestTypeCounts } from '../types';

export interface BadgeDefinition {
  id: BadgeId;
  title: string;
  description: string;
  emoji: string;
  color: string;
}

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  '6-8': '6–8 лет',
  '9-11': '9–11 лет',
};

export const BADGES: Record<BadgeId, BadgeDefinition> = {
  first_quest: {
    id: 'first_quest',
    title: 'Первый шаг',
    description: 'Первая выполненная задача',
    emoji: '🌱',
    color: '#765fde',
  },
  three_in_a_day: {
    id: 'three_in_a_day',
    title: 'Ритм дня',
    description: 'Три задания за один день',
    emoji: '🎯',
    color: '#ff6170',
  },
  balanced_day: {
    id: 'balanced_day',
    title: 'Баланс',
    description: 'Знания, творчество и энергия в один день',
    emoji: '⚖️',
    color: '#f0a000',
  },
  streak_3: {
    id: 'streak_3',
    title: 'Серия 3',
    description: 'Три дня подряд с заданиями',
    emoji: '🔥',
    color: '#ff8811',
  },
  streak_7: {
    id: 'streak_7',
    title: 'Серия 7',
    description: 'Неделя активности без пропусков',
    emoji: '🏆',
    color: '#3fbf6f',
  },
  quiz_master: {
    id: 'quiz_master',
    title: 'Умник',
    description: 'Две и более задачи на логику и счёт',
    emoji: '🧠',
    color: '#4d75ff',
  },
  versatile_player: {
    id: 'versatile_player',
    title: 'Универсал',
    description: 'Попробовал все типы заданий',
    emoji: '✨',
    color: '#8f52ff',
  },
};

function toDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDayKey(dayKey: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function dayDiff(fromKey: string, toKey: string): number {
  const from = parseDayKey(fromKey);
  const to = parseDayKey(toKey);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export function getTodayKey(): string {
  return toDayKey();
}

export function getAgeLabel(ageGroup: AgeGroup): string {
  return AGE_GROUP_LABELS[ageGroup];
}

export function createQuestTypeCounts(): QuestTypeCounts {
  return {
    reading: 0,
    photo: 0,
    activity: 0,
    story: 0,
    quiz: 0,
  };
}

export function mergeQuestTypeCounts(source?: Partial<QuestTypeCounts>): QuestTypeCounts {
  return {
    ...createQuestTypeCounts(),
    ...source,
  };
}

export function isQuestAvailableForAge(quest: Quest, ageGroup: AgeGroup): boolean {
  return !quest.ageGroups || quest.ageGroups.includes(ageGroup);
}

export function filterQuestsByAge(quests: Quest[], ageGroup: AgeGroup): Quest[] {
  return quests.filter(quest => isQuestAvailableForAge(quest, ageGroup));
}

export function getDailyQuestIndex(seed: string, quests: Quest[]): number {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash % quests.length;
}

export function getNewBadges(state: Pick<GameState, 'badges' | 'completedQuestsToday' | 'streak' | 'lifetimeQuestsCompleted' | 'questTypeCounts'>): BadgeId[] {
  const unlocked = new Set(state.badges);

  if (state.lifetimeQuestsCompleted >= 1) unlocked.add('first_quest');
  if (state.completedQuestsToday.length >= 3) unlocked.add('three_in_a_day');
  if (new Set(state.completedQuestsToday.map(q => q.needType)).size >= 3) unlocked.add('balanced_day');
  if (state.streak >= 3) unlocked.add('streak_3');
  if (state.streak >= 7) unlocked.add('streak_7');
  if (state.questTypeCounts.quiz >= 2) unlocked.add('quiz_master');

  const completedTypes = new Set<Quest['type']>();
  if (state.questTypeCounts.reading > 0 || state.questTypeCounts.story > 0) completedTypes.add('reading');
  if (state.questTypeCounts.photo > 0) completedTypes.add('photo');
  if (state.questTypeCounts.activity > 0) completedTypes.add('activity');
  if (state.questTypeCounts.quiz > 0) completedTypes.add('quiz');
  if (completedTypes.size >= 4) unlocked.add('versatile_player');

  return [...unlocked];
}

export function getNewBadgeIds(previous: BadgeId[], next: BadgeId[]): BadgeId[] {
  return next.filter(id => !previous.includes(id));
}

export function getStreakFromDates(lastActivityDate: string | null, currentDate = getTodayKey()): number {
  if (!lastActivityDate) return 0;
  const gap = dayDiff(lastActivityDate, currentDate);
  if (gap <= 1) return 0;
  return gap;
}

export function getDailyQuestForAge(quests: Quest[], ageGroup: AgeGroup, dayKey = getTodayKey()): Quest | undefined {
  const available = filterQuestsByAge(quests, ageGroup);
  if (!available.length) return undefined;
  const index = getDailyQuestIndex(`${ageGroup}:${dayKey}`, available);
  return available[index];
}
