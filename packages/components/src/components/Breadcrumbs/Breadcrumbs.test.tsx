import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Breadcrumbs } from './Breadcrumbs';

expect.extend(toHaveNoViolations);

it('Breadcrumbs basic a11y test', async () => {
  const { container } = render(
    <Breadcrumbs
      items={[
        { '@id': '/', title: 'Home' },
        { '@id': '/folder', title: 'Folder' },
        { '@id': '/folder/page', title: 'Page' },
      ]}
    />,
  );

  const results = await axe(container);

  expect(results).toHaveNoViolations();
});

it('Breadcrumbs with navigation landmark test', async () => {
  const { container } = render(
    <Breadcrumbs
      withNavigationLandmark
      items={[
        { '@id': '/', title: 'Home' },
        { '@id': '/folder', title: 'Folder' },
        { '@id': '/folder/page', title: 'Page' },
      ]}
    />,
  );

  const results = await axe(container);

  expect(results).toHaveNoViolations();
  expect(container.firstChild.nodeName).toEqual('NAV');
  expect(container.firstChild.getAttribute('role')).toEqual('navigation');
  expect(container.firstChild.getAttribute('aria-label')).toEqual(
    'Breadcrumbs',
  );
});
