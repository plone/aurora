import './storybook-base.css';
import '../../theming/styles/tailwind.css';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from '../locales/en/common.json';

// The components translate their texts with `useTranslation`, as in the app.
// Without an i18next instance, they would show the translation keys. Stories
// that need their own texts can still wrap themselves in an
// `I18nextProvider`.
i18next.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common'],
  resources: { en: { common } },
  interpolation: { escapeValue: false },
  initAsync: false,
});

export const parameters = {
  backgrounds: {},
  options: {
    storySort: {
      order: [
        'Introduction',
        'Styleguide',
        'Tailwind',
        'Basic',
        ['Forms', 'Quanta', '*'],
      ],
    },
  },
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const initialGlobals = {
  backgrounds: {
    value: 'light',
  },
};
