import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/libs/firebase';
import en from './en/global.json';
import ch from './ch/global.json'; 
import es from './es/global.json';  

// Function to get user's preferred language from Firestore
const getUserLanguageFromFirestore = async (): Promise<string> => {
  try {
    const { initData } = retrieveLaunchParams();
    const telegramId = initData?.user?.id;
    
    if (telegramId) {
      const userRef = doc(db, 'users', String(telegramId));
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData?.languageCode && ['en', 'zh', 'es'].includes(userData.languageCode)) {
          return userData.languageCode;
        }
      }
    }
  } catch (error) {
    console.warn('Error fetching user language from Firestore:', error);
  }

  // Fallback to Telegram WebApp language or default
  try {
    const { initData } = retrieveLaunchParams();
    const telegramLang = initData?.user?.languageCode;
    if (telegramLang && ['en', 'zh', 'es'].includes(telegramLang)) {
      return telegramLang;
    }
  } catch (error) {
    console.warn('Error reading Telegram language:', error);
  }

  // Final fallback
  return 'en';
};

// Initialize i18n synchronously first with default language
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { global: en },
      zh: { global: ch },  
      es: { global: es },
    },
    lng: 'en', // Start with English as default
    fallbackLng: 'en',  
    ns: ['global'],
    defaultNS: 'global',
    interpolation: {
      escapeValue: false,  
    },
  });

// Function to update i18n language when user data is available
export const updateI18nLanguage = async () => {
  try {
    const userLanguage = await getUserLanguageFromFirestore();
    if (i18n.language !== userLanguage) {
      await i18n.changeLanguage(userLanguage);
    }
  } catch (error) {
    console.warn('Error updating i18n language:', error);
  }
};

export default i18n;
