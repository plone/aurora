import '@plone/icons/icons.css';
import './storybook.css';

export const parameters = {
  options: {
    storySort: {
      order: ['Control panels', ['Introduction', '*']],
    },
  },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
