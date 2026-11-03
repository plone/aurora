import './storybook-base.css';
import '../../theming/styles/tailwind.css';
import '@plone/icons/icons.css';
import '../src/styles/main.css';

export const parameters = {
  backgrounds: {},
  options: {
    storySort: {
      order: [
        'Introduction',
        'Styleguide',
        'Tailwind',
        'Quanta',
        ['Introduction', 'Forms', '*'],
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
