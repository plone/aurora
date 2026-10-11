import React from 'react';
import { expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ToggleButton, ToggleButtonGroup } from './ToggleButton';

expect.extend(toHaveNoViolations);

it('ToggleButtonGroup selects one segment and is accessible', async () => {
  const { container } = render(
    <ToggleButtonGroup
      aria-label="Show"
      selectionMode="single"
      defaultSelectedKeys={['all']}
    >
      <ToggleButton id="all">All</ToggleButton>
      <ToggleButton id="custom">Custom</ToggleButton>
    </ToggleButtonGroup>,
  );

  const all = screen.getByRole('radio', { name: 'All' });
  const custom = screen.getByRole('radio', { name: 'Custom' });
  expect(all).toBeChecked();
  fireEvent.click(custom);
  expect(custom).toBeChecked();
  expect(all).not.toBeChecked();

  expect(await axe(container)).toHaveNoViolations();
});
