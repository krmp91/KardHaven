export type CardFinish = 'normal' | 'holo' | 'reverse_holo' | 'other';

export type CardCondition = 'NM' | 'EX' | 'GD' | 'LP' | 'PL' | 'PO';

export const CARD_CONDITIONS: CardCondition[] = ['NM', 'EX', 'GD', 'LP', 'PL', 'PO'];

// Matches TCGdex's supported language codes (confirmed via its SDK's SupportedLanguages
// type) — this is the card's printed language, stored per collection item, independent
// of what language the catalog search itself is done in.
export const CARD_LANGUAGES = [
  'EN',
  'JA',
  'FR',
  'DE',
  'IT',
  'ES',
  'ES-MX',
  'PT',
  'PT-BR',
  'NL',
  'PL',
  'RU',
  'KO',
  'ZH-TW',
  'ZH-CN',
  'ID',
  'TH',
] as const;

export type CardLanguage = (typeof CARD_LANGUAGES)[number];
