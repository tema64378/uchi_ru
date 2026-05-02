import type { NeedType } from '../types';

export interface CompanionCard {
  id: string;
  stationId?: NeedType | 'daily';
  name: string;
  role: string;
  gift: string;
  asset: string;
  color: string;
  accent: string;
  tag: string;
  facts: string[];
}

export const COMPANION_CATALOG: CompanionCard[] = [
  {
    id: 'learning',
    stationId: 'learning',
    name: 'Пират Блу',
    role: 'Хранитель вопросов',
    gift: 'Синяя звезда',
    asset: '/assets/chars/pirate_blue.png',
    color: '#765fde',
    accent: '#ece8ff',
    tag: 'Станция знаний',
    facts: [
      'Пират Блу любит находить вопросы, на которые хочется искать ответ вместе.',
      'Он хранит карту маленьких открытий и радуется каждому чтению вслух.',
    ],
  },
  {
    id: 'creative',
    stationId: 'creative',
    name: 'Пинки',
    role: 'Капитан мастерской',
    gift: 'Радужный набор',
    asset: '/assets/chars/pirate_pink.png',
    color: '#ff6170',
    accent: '#ffe8ea',
    tag: 'Станция творчества',
    facts: [
      'Пинки коллекционирует идеи, которые появляются из рисунков и фотографий.',
      'Ей нравятся смелые цвета и смешные формы, которые потом можно дорисовать.',
    ],
  },
  {
    id: 'daily',
    stationId: 'daily',
    name: 'Светик',
    role: 'Проводник дня',
    gift: 'Золотой лист',
    asset: '/assets/chars/dino2.png',
    color: '#3aafff',
    accent: '#e5f5ff',
    tag: 'Задание дня',
    facts: [
      'Светик каждый день приносит новую тропинку и маленький сюрприз.',
      'Он особенно радуется, когда маршрут не пропадает и превращается в привычку.',
    ],
  },
  {
    id: 'energy',
    stationId: 'energy',
    name: 'Пурпур',
    role: 'Тренер поляны',
    gift: 'Ритм-браслет',
    asset: '/assets/chars/pirate_purple.png',
    color: '#f0a000',
    accent: '#fff3c8',
    tag: 'Станция движения',
    facts: [
      'Пурпур любит короткие разминки, потому что после них легче думать и смеяться.',
      'Он всегда знает, как превратить прыжки в весёлую игру.',
    ],
  },
  {
    id: 'buddy-1',
    name: 'Луна',
    role: 'Собирательница историй',
    gift: 'Лунная наклейка',
    asset: '/assets/chars/dino4.png',
    color: '#4d75ff',
    accent: '#e5f5ff',
    tag: 'Гость карты',
    facts: [
      'Луна запоминает самые тёплые моменты дня и прячет их в маленькие звёзды.',
      'Она любит спокойные задания, где можно читать и слушать.',
    ],
  },
  {
    id: 'buddy-2',
    name: 'Кекс',
    role: 'Почтовый помощник',
    gift: 'Цветной карандаш',
    asset: '/assets/chars/dino5.png',
    color: '#ff8a00',
    accent: '#fff0d9',
    tag: 'Гость карты',
    facts: [
      'Кекс приносит идеи туда, где их не ждали, и любит маленькие открытия.',
      'Он считает, что лучший подарок — это тёплая мысль и готовность пробовать новое.',
    ],
  },
  {
    id: 'buddy-3',
    name: 'Зефир',
    role: 'Тихий советчик',
    gift: 'Мягкое облако',
    asset: '/assets/chars/dino1.png',
    color: '#29b37d',
    accent: '#e7fff5',
    tag: 'Гость карты',
    facts: [
      'Зефир умеет подбирать спокойный ритм, когда хочется немного замедлиться.',
      'Он любит делать паузу и смотреть, как растёт внимательность.',
    ],
  },
  {
    id: 'buddy-4',
    name: 'Ракета',
    role: 'Скоростной друг',
    gift: 'Звёздный браслет',
    asset: '/assets/chars/dino3.png',
    color: '#ff6170',
    accent: '#ffe8ea',
    tag: 'Гость карты',
    facts: [
      'Ракета превращает активность в быстрый и очень весёлый старт.',
      'Он напоминает, что короткое движение может очень хорошо разбудить голову.',
    ],
  },
];

export function getCompanionByNeed(needType: NeedType | 'daily') {
  return COMPANION_CATALOG.find(companion => companion.stationId === needType) ?? COMPANION_CATALOG[0];
}

export function getCompanionById(id: string) {
  return COMPANION_CATALOG.find(companion => companion.id === id) ?? COMPANION_CATALOG[0];
}
