import './storybook-base.css';
import '../src/styles/basic/main.css';

export const parameters = {
  backgrounds: {},
  options: {
    storySort: {
      order: ['Introduction', 'Styleguide', 'Basic', ['Forms', '*']],
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
