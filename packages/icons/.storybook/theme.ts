import { create } from 'storybook/theming/create';
import logo from './Logo.svg';

export default create({
  base: 'light',
  brandTitle: '@plone/icons StoryBook',
  brandUrl: 'https://plone-icons.readthedocs.io/',
  brandImage: logo,
  brandTarget: '_self',
});
