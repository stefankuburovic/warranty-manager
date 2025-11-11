import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import srLatn from './locales/sr-Latn.json';
import srCyrl from './locales/sr-Cyrl.json';

const LANGUAGE_KEY = '@app_language';

// Get device language
const getDeviceLanguage = () => {
  try {
    const locale = Localization.locale;
    
    // Check if locale exists and is a string
    if (!locale || typeof locale !== 'string') {
      return 'en';
    }
    
    // Map device locale to supported languages
    if (locale.startsWith('sr')) {
      // Default to Latin for Serbian
      return 'sr-Latn';
    }
    
    return 'en';
  } catch (error) {
    console.error('Error getting device language:', error);
    return 'en';
  }
};

// Get saved language preference
const getSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage || getDeviceLanguage();
  } catch (error) {
    console.error('Error getting saved language:', error);
    return getDeviceLanguage();
  }
};

// Initialize i18n
const initI18n = async () => {
  try {
    const savedLanguage = await getSavedLanguage();
    
    // Ensure savedLanguage is valid, fallback to 'en' if not
    const validLanguage = ['en', 'sr-Latn', 'sr-Cyrl'].includes(savedLanguage) 
      ? savedLanguage 
      : 'en';
    
    await i18n
      .use(initReactI18next)
      .init({
        compatibilityJSON: 'v3',
        resources: {
          en: { translation: en },
          'sr-Latn': { translation: srLatn },
          'sr-Cyrl': { translation: srCyrl }
        },
        lng: validLanguage,
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false
        },
        react: {
          useSuspense: false
        }
      });
  } catch (error) {
    console.error('Error initializing i18n:', error);
    // Fallback initialization with English
    await i18n
      .use(initReactI18next)
      .init({
        compatibilityJSON: 'v3',
        resources: {
          en: { translation: en },
          'sr-Latn': { translation: srLatn },
          'sr-Cyrl': { translation: srCyrl }
        },
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false
        },
        react: {
          useSuspense: false
        }
      });
  }
};

// Change language
export const changeLanguage = async (language) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    await i18n.changeLanguage(language);
    return true;
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

// Get current language
export const getCurrentLanguage = () => {
  return i18n.language;
};

// Get available languages
export const getAvailableLanguages = () => {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'sr-Latn', name: 'Serbian (Latin)', nativeName: 'Srpski (latinica)' },
    { code: 'sr-Cyrl', name: 'Serbian (Cyrillic)', nativeName: 'Српски (ћирилица)' }
  ];
};

initI18n();

export default i18n;

