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
  stop: () => Promise<string>;
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
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const pendingStopRef = useRef<((value: string) => void) | null>(null);

  const Rec = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;
  const supported = !!Rec;

  const stop = useCallback(() => {
    return new Promise<string>(resolve => {
      pendingStopRef.current = resolve;
      recRef.current?.stop();

      if (!recRef.current) {
        pendingStopRef.current = null;
        resolve(`${finalTranscriptRef.current} ${interimTranscriptRef.current}`.replace(/\s+/g, ' ').trim());
      }
    });
  }, []);

  const start = useCallback(() => {
    if (!Rec) return;
    pendingStopRef.current = null;
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
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
      finalTranscriptRef.current = `${finalTranscriptRef.current} ${final}`.replace(/\s+/g, ' ').trim();
      interimTranscriptRef.current = interim.trim();
      const next = `${finalTranscriptRef.current} ${interimTranscriptRef.current}`.replace(/\s+/g, ' ').trim();
      setTranscript(next);
    };

    rec.onerror = () => setState('error');
    rec.onend = () => {
      setState(prev => prev === 'listening' ? 'done' : prev);
      const value = `${finalTranscriptRef.current} ${interimTranscriptRef.current}`.replace(/\s+/g, ' ').trim();
      if (pendingStopRef.current) {
        pendingStopRef.current(value);
        pendingStopRef.current = null;
      }
    };

    rec.start();
  }, [Rec]);

  const reset = useCallback(() => {
    recRef.current?.abort();
    pendingStopRef.current = null;
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    setTranscript('');
    setState('idle');
  }, []);

  useEffect(() => () => recRef.current?.abort(), []);

  return { state, transcript, start, stop, reset, supported };
}
