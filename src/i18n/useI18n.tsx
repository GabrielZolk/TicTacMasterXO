import React, { useState, useContext, createContext, ReactNode, useEffect } from 'react';
import { translations, Language, TranslationKey, NestedTranslationKey } from './translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey | NestedTranslationKey, params?: Record<string, string>) => string;
  availableLanguages: Language[];
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

// Function to detect device language and map to supported languages
const getDeviceLanguage = (): Language => {
  const deviceLocale = Localization.locale || 'pt-BR';
  const languageCode = deviceLocale.split('-')[0].toLowerCase();
  
  // Map device language to supported languages
  const languageMap: Record<string, Language> = {
    'pt': 'pt',
    'en': 'en', 
    'es': 'es',
    'fr': 'fr',
  };
  
  return languageMap[languageCode] || 'pt'; // Default to Portuguese
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getDeviceLanguage());

  const setLanguage = async (newLanguage: Language) => {
    setLanguageState(newLanguage);
    await AsyncStorage.setItem('@game_language', newLanguage);
  };

  // Load saved language on app start (prioritize saved setting over device detection)
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('@game_language');
        if (savedLanguage && savedLanguage in translations) {
          setLanguageState(savedLanguage as Language);
        } else {
          // If no saved language, use device detection
          const deviceLang = getDeviceLanguage();
          setLanguageState(deviceLang);
          console.info(`Auto-detected device language: ${deviceLang}`);
        }
      } catch (error) {
        console.warn('Failed to load language:', error);
        // Fallback to device language detection
        setLanguageState(getDeviceLanguage());
      }
    };
    
    loadLanguage();
  }, []);

  const t = (key: TranslationKey | NestedTranslationKey, params?: Record<string, string>): string => {
    try {
      // Handle nested keys like 'vsAI.title'
      const keys = key.split('.');
      let value: any = translations[language];
      
      for (const k of keys) {
        value = value?.[k];
      }
      
      let result = value || key; // Fallback to key if translation not found
      
      // Replace parameters in the translation
      if (params && typeof result === 'string') {
        Object.entries(params).forEach(([param, replacement]) => {
          result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), replacement);
        });
      }
      
      return result;
    } catch (error) {
      console.warn(`Translation error for key: ${key}`, error);
      return key; // Fallback to key
    }
  };

  const availableLanguages: Language[] = ['pt', 'en', 'es', 'fr'];

  const contextValue: I18nContextValue = {
    language,
    setLanguage,
    t,
    availableLanguages,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
