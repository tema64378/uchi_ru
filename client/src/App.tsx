import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { loadGameState, saveGameState, completeQuest, decayNeeds } from './lib/gameState';
import { ALL_QUESTS } from './lib/quests';
import { saveSession } from './lib/api';

import type { GameState } from './types';

import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { QuestSelectPage } from './pages/QuestSelectPage';
import { ReadingTaskPage } from './pages/ReadingTaskPage';
import { PhotoTaskPage } from './pages/PhotoTaskPage';
import { ActivityTaskPage } from './pages/ActivityTaskPage';
import { QuizTaskPage } from './pages/QuizTaskPage';
import { RewardPage } from './pages/RewardPage';
import { ParentDashboard } from './pages/ParentDashboard';

// pages declare needType as string; we cast to NeedType internally
type QuestCompleteFn = (questId: string, xpEarned: number, needType: string, photoUrl?: string) => void;

// Initialise state once — load from localStorage + apply time-based decay
function initState(): GameState {
  const loaded = loadGameState();
  return decayNeeds(loaded);
}

function AppRoutes() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>(initState);
  const [showParent, setShowParent] = useState(false);

  // ------------------------------------------------------------------ handlers

  function handleOnboardingComplete(name: string, ageGroup: GameState['ageGroup']) {
    const next: GameState = {
      ...gameState,
      childName: name,
      ageGroup,
    };
    saveGameState(next);
    setGameState(next);
    navigate('/');
  }

  const handleQuestComplete: QuestCompleteFn = (questId, xpEarned, _needType, photoUrl) => {
    const quest = ALL_QUESTS.find(q => q.id === questId);
    if (!quest) return;

    const prevLevel = gameState.pet.level;
    const result = completeQuest(gameState, quest, photoUrl);
    const newState = result.state;
    const levelUp = newState.pet.level > prevLevel;

    setGameState(newState);

    // Fire-and-forget — never block navigation on this
    saveSession({
      childName: newState.childName,
      completedQuests: newState.completedQuestsToday,
      totalXp: newState.lifetimeXpEarned,
      petLevel: newState.pet.level,
      ageGroup: newState.ageGroup,
      streak: newState.streak,
      questTypeCounts: newState.questTypeCounts,
      badges: newState.badges,
      lifetimeQuestsCompleted: newState.lifetimeQuestsCompleted,
      lifetimeXpEarned: newState.lifetimeXpEarned,
    }).catch(() => { /* ignore network errors */ });

    navigate(`/reward/${questId}`, {
      state: {
        xpEarned,
        levelUp,
        newLevel: newState.pet.level,
        newBadges: result.newBadges,
        streak: newState.streak,
        totalQuests: newState.lifetimeQuestsCompleted,
      },
    });
  };

  function handleRewardCollected() {
    navigate('/');
  }

  function handleParentView() {
    setShowParent(true);
  }

  // ------------------------------------------------------------------ render

  const isOnboarded = Boolean(gameState.childName);

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            isOnboarded
              ? <HomePage state={gameState} onParentView={handleParentView} />
              : <OnboardingPage onComplete={handleOnboardingComplete} />
          }
        />

        <Route
          path="/quest/:needType"
          element={
            isOnboarded
              ? <QuestSelectPage state={gameState} />
              : <Navigate to="/" replace />
          }
        />

        <Route
          path="/task/reading/:questId"
          element={<ReadingTaskPage onComplete={handleQuestComplete} />}
        />
        <Route
          path="/task/story/:questId"
          element={<ReadingTaskPage onComplete={handleQuestComplete} />}
        />
        <Route
          path="/task/photo/:questId"
          element={<PhotoTaskPage onComplete={handleQuestComplete} />}
        />
        <Route
          path="/task/activity/:questId"
          element={<ActivityTaskPage onComplete={handleQuestComplete} />}
        />
        <Route
          path="/task/quiz/:questId"
          element={<QuizTaskPage onComplete={handleQuestComplete} />}
        />

        <Route
          path="/reward/:questId"
          element={<RewardPage onRewardCollected={handleRewardCollected} />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Parent dashboard — full-screen overlay */}
      <AnimatePresence>
        {showParent && (
          <motion.div
            key="parent-overlay"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 bg-white overflow-y-auto"
          >
            <ParentDashboard
              state={gameState}
              onBack={() => setShowParent(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
