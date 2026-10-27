import './storybook-base.css';
import '../src/styles/icons.css';

export const parameters = {
  backgrounds: {},
  options: {
    storySort: {
      order: ['Introduction', 'Gallery', 'Icon', 'IconSVGR'],
    },
  },
  controls: {
    matchers: {
      color: /(background|color)$/i,
    },
  },
};

export const initialGlobals = {
  backgrounds: {
    value: 'light',
  },
};
