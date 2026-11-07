import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import config from '@plone/registry';
import installComponents from '@plone/layout/config/components';
expect.extend(toHaveNoViolations);

installComponents(config);

// jsdom has no Web Animations API. React Aria's `SelectionIndicator` (in the
// Quanta tabs) reads the running animations of an element.
if (typeof Element !== 'undefined' && !Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => [];
}
