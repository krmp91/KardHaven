import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Language = 'da' | 'en';

const STORAGE_KEY = 'kardhaven-language';

const translations = {
  da: {
    login: {
      signIn: 'Log ind',
      signUp: 'Opret bruger',
      emailPlaceholder: 'Email',
      passwordPlaceholder: 'Adgangskode',
      confirmEmailNotice: 'Tjek din e-mail for at bekræfte din konto, og log derefter ind.',
      newUserPrompt: 'Ny bruger? Opret konto',
      hasAccountPrompt: 'Har du allerede en konto? Log ind',
    },
    tabs: {
      collection: 'Samling',
      search: 'Søg',
      wishlist: 'Ønskeliste',
      profile: 'Profil',
    },
    collection: {
      loadError: 'Kunne ikke hente din samling.',
      empty: 'Din samling er tom. Søg efter et kort under Søg-fanen for at tilføje det.',
      unknownCard: 'Ukendt kort',
      notFound: 'Kortet blev ikke fundet i din samling.',
      conditionLabel: 'Stand',
      conditionNone: 'Ikke angivet',
      saveButton: 'Gem',
      saveError: 'Kunne ikke gemme. Prøv igen.',
      deleteButton: 'Fjern fra samling',
      deleteConfirmTitle: 'Fjern kort',
      deleteConfirmMessage: 'Er du sikker på, at du vil fjerne dette kort fra din samling?',
      deleteConfirmCancel: 'Annuller',
      deleteConfirmConfirm: 'Fjern',
      deleteError: 'Kunne ikke fjerne kortet. Prøv igen.',
    },
    search: {
      placeholder: 'Søg efter et kort...',
      numberPlaceholder: 'Nr.',
      button: 'Søg',
      failed: 'Søgningen fejlede. Prøv igen.',
      noResults: 'Ingen kort fundet.',
      prompt: 'Søg efter et Pokémon-kort ovenfor.',
    },
    wishlist: {
      title: 'Ønskeliste',
      description: 'Her kommer de kort, du ønsker dig, når kortkataloget er koblet på.',
    },
    profile: {
      signOut: 'Log ud',
      language: 'Sprog',
    },
    card: {
      languageLabel: 'Kortets sprog',
      loadErrorPrefix: 'Kunne ikke hente kortet',
      notFound: 'Kortet blev ikke fundet.',
      variantLabel: 'Variant',
      quantityLabel: 'Antal',
      addButton: 'Tilføj til samling',
      addSuccess: 'Tilføjet til din samling ✅',
      addError: 'Noget gik galt. Prøv igen.',
      imageError: 'Billedet kunne ikke indlæses (netværk?)',
    },
    finish: {
      normal: 'Normal',
      holo: 'Holo',
      reverse_holo: 'Reverse holo',
      other: 'Andet',
    },
  },
  en: {
    login: {
      signIn: 'Sign in',
      signUp: 'Create account',
      emailPlaceholder: 'Email',
      passwordPlaceholder: 'Password',
      confirmEmailNotice: 'Check your email to confirm your account, then sign in.',
      newUserPrompt: 'New user? Create an account',
      hasAccountPrompt: 'Already have an account? Sign in',
    },
    tabs: {
      collection: 'Collection',
      search: 'Search',
      wishlist: 'Wishlist',
      profile: 'Profile',
    },
    collection: {
      loadError: "Couldn't load your collection.",
      empty: 'Your collection is empty. Search for a card under the Search tab to add one.',
      unknownCard: 'Unknown card',
      notFound: 'This item was not found in your collection.',
      conditionLabel: 'Condition',
      conditionNone: 'Not set',
      saveButton: 'Save',
      saveError: "Couldn't save. Try again.",
      deleteButton: 'Remove from collection',
      deleteConfirmTitle: 'Remove card',
      deleteConfirmMessage: 'Are you sure you want to remove this card from your collection?',
      deleteConfirmCancel: 'Cancel',
      deleteConfirmConfirm: 'Remove',
      deleteError: "Couldn't remove the card. Try again.",
    },
    search: {
      placeholder: 'Search for a card...',
      numberPlaceholder: 'No.',
      button: 'Search',
      failed: 'The search failed. Try again.',
      noResults: 'No cards found.',
      prompt: 'Search for a Pokémon card above.',
    },
    wishlist: {
      title: 'Wishlist',
      description: 'The cards you wish for will show up here once the catalog is fully wired up.',
    },
    profile: {
      signOut: 'Sign out',
      language: 'Language',
    },
    card: {
      languageLabel: "Card's language",
      loadErrorPrefix: "Couldn't load the card",
      notFound: 'Card not found.',
      variantLabel: 'Variant',
      quantityLabel: 'Quantity',
      addButton: 'Add to collection',
      addSuccess: 'Added to your collection ✅',
      addError: 'Something went wrong. Try again.',
      imageError: "The image couldn't load (network?)",
    },
    finish: {
      normal: 'Normal',
      holo: 'Holo',
      reverse_holo: 'Reverse holo',
      other: 'Other',
    },
  },
} as const;

type Translations = typeof translations.da;

function get(obj: any, path: string): string {
  return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj) ?? path;
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('da');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'da' || stored === 'en') {
        setLanguageState(stored);
      }
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  };

  const t = (key: string) => get(translations[language], key);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export type { Translations };
