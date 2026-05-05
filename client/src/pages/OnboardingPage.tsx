import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AgeGroup } from '../types';
import { getAgeLabel } from '../lib/progression';
import { PlayGuideStrip } from '../components/PlayGuideStrip';

interface Props {
  onComplete: (name: string, ageGroup: AgeGroup) => void;
}

const AGE_GROUPS: { value: AgeGroup; title: string; description: string; icon: string }[] = [
  { value: '6-8', title: '6–8 лет', description: 'Короткие задания, больше визуала и простые формулировки.', icon: '🌱' },
  { value: '9-11', title: '9–11 лет', description: 'Чуть больше логики, счёта и самостоятельности.', icon: '🚀' },
];

export function OnboardingPage({ onComplete }: Props) {
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('6-8');
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen bg-[#F5F4FF] flex flex-col items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-sm text-center"
          >
            <motion.img
              src="/assets/chars/dino3.png"
              alt="Дракоша"
              className="w-44 h-44 object-contain mx-auto mb-6 animate-float"
            />
            <h1 className="text-h2 font-black text-text mb-3">
              Привет! Я — Дракоша 🐉
            </h1>
            <p className="text-body-md text-text-muted mb-8 leading-relaxed">
              Я твой звёздный питомец. Помоги мне расти, путешествуя по карте и выполняя задания.
            </p>
            <button className="btn-primary w-full text-h4" onClick={() => setStep(1)}>
              Начать
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-sm text-center"
          >
            <motion.img
              src="/assets/chars/dino1.png"
              alt="Дракоша"
              className="w-36 h-36 object-contain mx-auto mb-6"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <h2 className="text-h3 font-black text-text mb-2">Как тебя зовут?</h2>
            <p className="text-body-sm text-text-muted mb-6">
              Дракоша хочет знать имя своего спутника.
            </p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Введи своё имя..."
              maxLength={20}
              className="w-full px-5 py-4 rounded-[16px] border-2 border-[#EDEAFF] bg-white
                         text-body-lg font-black text-text text-center
                         focus:outline-none focus:border-primary transition-colors mb-4"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
            />
            <button
              className="btn-primary w-full"
              disabled={!name.trim()}
              onClick={() => setStep(2)}
            >
              Это я
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-md text-center"
          >
            <motion.img
              src="/assets/chars/dino4.png"
              alt="Дракоша"
              className="w-40 h-40 object-contain mx-auto mb-4"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <h2 className="text-h3 font-black text-text mb-2">Сколько тебе лет?</h2>
            <p className="text-body-md text-text-muted mb-6 leading-relaxed">
              Так Дракоша подберёт задания, которые подходят именно тебе.
            </p>

            <div className="grid gap-3 mb-8">
              {AGE_GROUPS.map(item => (
                <button
                  key={item.value}
                  onClick={() => setAgeGroup(item.value)}
                  className={`text-left rounded-[18px] border-2 p-4 transition-all duration-200 ${
                    ageGroup === item.value
                      ? 'border-primary bg-primary-light shadow-hover'
                      : 'border-[#EDEAFF] bg-white hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{item.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-body-md font-black text-text">{item.title}</h3>
                        {ageGroup === item.value && (
                          <span className="soft-chip bg-primary text-white">Выбрано</span>
                        )}
                      </div>
                      <p className="text-body-sm text-text-muted mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setStep(1)}>
                Назад
              </button>
              <button className="btn-brand flex-1" onClick={() => setStep(3)}>
                Дальше
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-sm text-center"
          >
            <motion.img
              src="/assets/chars/dino5.png"
              alt="Дракоша"
              className="w-44 h-44 object-contain mx-auto mb-4"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <h2 className="text-h3 font-black text-text mb-2">
              Готово, {name}! 🎉
            </h2>
            <p className="text-body-md text-text-muted mb-6 leading-relaxed">
              Возраст: {getAgeLabel(ageGroup)}. Сейчас откроется карта, где можно выбирать задания и получать подарки.
            </p>

            <PlayGuideStrip className="mb-8 text-left" compact />

            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setStep(2)}>
                Назад
              </button>
              <button className="btn-primary flex-1 text-h4" onClick={() => onComplete(name.trim(), ageGroup)}>
                Открыть карту
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
