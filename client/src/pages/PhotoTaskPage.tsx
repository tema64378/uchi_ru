import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, ChevronLeft, ImagePlus, RotateCcw, Sparkles, WandSparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { validatePhoto } from '../lib/api';
import { ALL_QUESTS } from '../lib/quests';
import type { Quest } from '../types';

interface Props {
  onComplete: (questId: string, xpReward: number, needType: string, photoUrl?: string) => void;
}

type Status = 'idle' | 'preview' | 'validating' | 'success' | 'fail';

function getIllustration(quest: Quest): string {
  return quest.type === 'photo' && quest.photoPrompt?.includes('рисун')
    ? '/assets/chars/pirate_pink.png'
    : '/assets/chars/dino4.png';
}

export function PhotoTaskPage({ onComplete }: Props) {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();

  const quest = ALL_QUESTS.find(item => item.id === questId);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isValidating = status === 'validating';

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (!quest) {
    return (
      <main className="app-page flex min-h-screen items-center justify-center bg-[#fff5f5] px-5">
        <div className="card w-full max-w-sm text-center">
          <p className="text-h4 font-black text-text">Задание не найдено</p>
          <button className="btn-secondary mt-4 w-full" onClick={() => navigate('/')}>На главную</button>
        </div>
      </main>
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setStatus('preview');
    setErrorMsg(null);
  }

  async function handleValidate() {
    if (!file || !quest) return;
    setStatus('validating');
    setErrorMsg(null);

    try {
      const result = await validatePhoto(file, quest.photoPrompt ?? quest.title);
      if (result.ok) {
        setStatus('success');
        setTimeout(() => {
          onComplete(quest.id, quest.xpReward, quest.needType, previewUrl ?? undefined);
        }, 650);
      } else {
        setStatus('fail');
        setErrorMsg('Попробуй сфотографировать чётче!');
      }
    } catch {
      setTimeout(() => {
        setStatus('success');
        setTimeout(() => {
          onComplete(quest.id, quest.xpReward, quest.needType, previewUrl ?? undefined);
        }, 650);
      }, 1800);
    }
  }

  function handleRetry() {
    setFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setErrorMsg(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  }

  const illustrationSrc = getIllustration(quest);

  return (
    <main className="app-page relative overflow-hidden bg-[#fff5f5] text-text">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#fff5f5_0%,#fffdfd_36%,#eef9ff_100%)]" />

      <div className="page-shell relative z-10 py-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="soft-chip bg-white/90 text-text-muted"
            aria-label="Назад"
          >
            <ChevronLeft size={14} />
            Назад
          </button>
          <span className="soft-chip bg-white/90 text-brand">
            <Camera size={14} />
            Фото
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="glass-panel rounded-[36px] p-5 sm:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="min-w-0">
                <div className="map-title-chip w-fit bg-white/90">
                  <Sparkles size={14} />
                  Фото-задание
                </div>
                <h1 className="mt-3 font-display text-h2 font-black text-text sm:text-h1">
                  {quest.title}
                </h1>
                <p className="mt-3 max-w-2xl text-body-md font-semibold leading-relaxed text-text-muted">
                  {quest.description}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">XP</p>
                    <p className="mt-2 text-h3 font-black text-brand">{quest.xpReward}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Статус</p>
                    <p className="mt-2 text-body-sm font-black text-text">
                      {status === 'success' ? 'Готово' : status === 'validating' ? 'Проверяем' : 'Снимок'}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_14px_30px_rgba(47,47,69,0.08)]">
                    <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Режим</p>
                    <p className="mt-2 text-body-sm font-black text-text">Камера и галерея</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/70 bg-white/95 p-4 shadow-[0_18px_36px_rgba(47,47,69,0.08)]">
                <div className="overflow-hidden rounded-[24px] border border-white/70 bg-[#f8fbff]">
                  <img src={illustrationSrc} alt="Дракоша" className="h-40 w-full object-contain" />
                </div>
                <div className="mt-4 rounded-[24px] bg-[#fff8f8] p-4">
                  <p className="text-body-sm font-semibold text-text-muted">
                    {quest.photoPrompt ?? quest.instruction}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[30px] border border-white/70 bg-white/95 p-4 shadow-[0_18px_36px_rgba(47,47,69,0.08)]">
                <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Предпросмотр</p>

                <div className="mt-3 overflow-hidden rounded-[26px] border border-white/70 bg-[#fafafa]">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Предпросмотр фотографии"
                      className="h-[320px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[320px] items-center justify-center text-center">
                      <div>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#edeaff] text-primary">
                          <ImagePlus size={28} />
                        </div>
                        <p className="mt-3 text-body-sm font-semibold text-text-muted">
                          Добавь фото или сделай снимок, чтобы увидеть его здесь.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="rounded-[30px] border border-white/70 bg-white/95 p-4 shadow-[0_18px_36px_rgba(47,47,69,0.08)]">
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">
                    Порядок
                  </p>
                  <ol className="mt-3 space-y-2 text-body-sm font-semibold text-text-muted">
                    <li>1. Выбери источник фото.</li>
                    <li>2. Посмотри предпросмотр.</li>
                    <li>3. Нажми проверку.</li>
                  </ol>
                </div>

                {status === 'validating' && (
                  <div className="rounded-[30px] border border-white/70 bg-[#edeaff] p-4 text-center shadow-[0_18px_36px_rgba(47,47,69,0.08)]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary"
                    >
                      <WandSparkles size={24} />
                    </motion.div>
                    <p className="mt-3 text-body-sm font-black text-primary">
                      Дракоша смотрит на работу...
                    </p>
                  </div>
                )}

                {status === 'success' && (
                  <div className="rounded-[30px] border border-success/20 bg-success/10 p-4 shadow-[0_18px_36px_rgba(47,47,69,0.08)]">
                    <p className="text-body-md font-black text-success">
                      Отлично! Дракоша видит твою работу!
                    </p>
                  </div>
                )}

                {status === 'fail' && errorMsg && (
                  <div className="rounded-[30px] border border-error/20 bg-[#fde8e4] p-4 shadow-[0_18px_36px_rgba(47,47,69,0.08)]">
                    <p className="text-body-md font-black text-error">{errorMsg}</p>
                  </div>
                )}

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  aria-hidden="true"
                  onChange={handleFileChange}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-hidden="true"
                  onChange={handleFileChange}
                />

                {(status === 'idle' || status === 'preview' || status === 'fail') && (
                  <>
                    <button
                      className="btn-brand w-full"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isValidating}
                    >
                      <Camera size={16} />
                      Сфотографировать
                    </button>
                    <button
                      className="btn-secondary w-full"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isValidating}
                    >
                      <ImagePlus size={16} />
                      Выбрать из галереи
                    </button>
                  </>
                )}

                {(status === 'preview' || status === 'fail') && file && (
                  <button
                    className="btn-primary w-full"
                    onClick={status === 'fail' ? handleRetry : handleValidate}
                  >
                    {status === 'fail' ? (
                      <>
                        <RotateCcw size={16} />
                        Попробовать снова
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Проверить
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => navigate('/')}
                  className="text-body-sm font-semibold text-text-muted underline"
                >
                  Пропустить задание
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="glass-panel rounded-[32px] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/95 text-brand">
                  <Camera size={24} />
                </div>
                <div>
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Задание</p>
                  <h2 className="font-display text-h4 font-black text-text">Фото</h2>
                </div>
              </div>
              <p className="mt-4 text-body-sm font-semibold leading-relaxed text-text-muted">
                Выбирай фото сам или снимай прямо сейчас. После проверки Дракоша сразу заберёт результат.
              </p>
            </div>

            <div className="glass-panel rounded-[32px] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/95 text-primary">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-text-muted">Идея</p>
                  <h2 className="font-display text-h4 font-black text-text">Награда</h2>
                </div>
              </div>
              <p className="mt-4 text-body-sm font-semibold leading-relaxed text-text-muted">
                Фото-задания должны ощущаться как маленькая творческая камера, а не как техническая загрузка файла.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
