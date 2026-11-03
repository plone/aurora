import './storybook-base.css';
import '../../theming/styles/tailwind.css';
import config from '@plone/registry';
import { Link } from 'react-aria-components';
import installPlate from '../index';

installPlate(config);
// In the app, `@plone/layout` registers `Link`, which the link nodes render.
config.registerComponent({ name: 'Link', component: Link });

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
