import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en/global.json';
import ch from './ch/global.json'; 
import es from './es/global.json';  

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { global: en },
      zh: { global: ch },  
      es: { global: es },
    },
    lng: 'zh',  
    fallbackLng: 'en',  
    ns: ['global'],
    defaultNS: 'global',
    interpolation: {
      escapeValue: false,  
    },
  });
