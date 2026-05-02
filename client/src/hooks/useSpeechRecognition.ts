import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechState = 'idle' | 'listening' | 'done' | 'error';

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface UseSpeechReturn {
  state: SpeechState;
  transcript: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
  supported: boolean;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useSpeechRecognition(): UseSpeechReturn {
  const [state, setState] = useState<SpeechState>('idle');
  const [transcript, setTranscript] = useState('');
  const recRef = useRef<SpeechRecognitionInstance | null>(null);

  const Rec = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;
  const supported = !!Rec;

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (!Rec) return;
    setTranscript('');
    setState('listening');

    const rec = new Rec();
    recRef.current = rec;
    rec.lang = 'ru-RU';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let final = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + ' ';
        else interim += t;
      }
      setTranscript(prev => (prev + final || interim));
    };

    rec.onerror = () => setState('error');
    rec.onend = () => setState(prev => prev === 'listening' ? 'done' : prev);

    rec.start();
  }, [Rec]);

  const reset = useCallback(() => {
    recRef.current?.abort();
    setTranscript('');
    setState('idle');
  }, []);

  useEffect(() => () => recRef.current?.abort(), []);

  return { state, transcript, start, stop, reset, supported };
}
