import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import config from '@plone/registry';
import installComponents from '@plone/layout/config/components';
expect.extend(toHaveNoViolations);

installComponents(config);
