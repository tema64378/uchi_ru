type ToneStep = {
  frequency: number;
  duration: number;
  gain?: number;
  type?: OscillatorType;
  delay?: number;
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioContext) {
    audioContext = new AudioCtx();
  }
  return audioContext;
}

function playToneSequence(steps: ToneStep[]) {
  const ctx = getAudioContext();
  if (!ctx) return;

  void ctx.resume?.();

  const start = ctx.currentTime + 0.01;
  steps.forEach(step => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = step.type ?? 'sine';
    osc.frequency.value = step.frequency;
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(ctx.destination);

    const delay = step.delay ?? 0;
    const duration = step.duration;
    const peak = step.gain ?? 0.05;
    gain.gain.setValueAtTime(0, start + delay);
    gain.gain.linearRampToValueAtTime(peak, start + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + delay + duration);

    osc.start(start + delay);
    osc.stop(start + delay + duration + 0.02);
  });
}

export function playTapSound() {
  playToneSequence([
    { frequency: 520, duration: 0.06, gain: 0.03 },
    { frequency: 680, duration: 0.08, gain: 0.04, delay: 0.06 },
  ]);
}

export function playSuccessSound() {
  playToneSequence([
    { frequency: 523, duration: 0.1, gain: 0.04 },
    { frequency: 659, duration: 0.1, gain: 0.05, delay: 0.1 },
    { frequency: 784, duration: 0.16, gain: 0.06, delay: 0.2 },
  ]);
}

export function playGiftSound() {
  playToneSequence([
    { frequency: 740, duration: 0.08, gain: 0.04, type: 'triangle' },
    { frequency: 880, duration: 0.08, gain: 0.05, delay: 0.08, type: 'triangle' },
    { frequency: 988, duration: 0.16, gain: 0.06, delay: 0.16, type: 'triangle' },
  ]);
}
