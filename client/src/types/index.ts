export type NeedType = 'learning' | 'creative' | 'energy';
export type TaskType = 'reading' | 'photo' | 'activity' | 'story' | 'quiz';
export type AgeGroup = '6-8' | '9-11';
export type BadgeId =
  | 'first_quest'
  | 'three_in_a_day'
  | 'balanced_day'
  | 'streak_3'
  | 'streak_7'
  | 'quiz_master'
  | 'versatile_player';
export type ValidationStatus = 'idle' | 'validating' | 'success' | 'fail';

export interface Need {
  type: NeedType;
  label: string;
  emoji: string;
  color: string;
  value: number; // 0-100
  maxValue: number;
}

export interface Quest {
  id: string;
  type: TaskType;
  needType: NeedType;
  ageGroups?: AgeGroup[];
  title: string;
  description: string;
  instruction: string;
  xpReward: number;
  duration?: number; // seconds for activity tasks
  readingText?: string;
  photoPrompt?: string;
  quizQuestion?: string;
  quizOptions?: string[];
  quizAnswerIndex?: number;
  quizHint?: string;
}

export interface CompletedQuest {
  questId: string;
  completedAt: string;
  photoUrl?: string;
  xpEarned: number;
  taskType: TaskType;
  needType: NeedType;
  title: string;
}

export interface Pet {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  mood: 'happy' | 'neutral' | 'sad' | 'excited';
}

export interface GameSession {
  id: string;
  startedAt: string;
  completedQuests: CompletedQuest[];
  totalXp: number;
}

export interface QuestTypeCounts {
  reading: number;
  photo: number;
  activity: number;
  story: number;
  quiz: number;
}

export interface GameState {
  pet: Pet;
  needs: Need[];
  currentSession: GameSession | null;
  completedQuestsToday: CompletedQuest[];
  childName: string;
  ageGroup: AgeGroup;
  dailyProgressDate: string;
  lastActivityDate: string | null;
  streak: number;
  lifetimeQuestsCompleted: number;
  lifetimeXpEarned: number;
  questTypeCounts: QuestTypeCounts;
  badges: BadgeId[];
}
