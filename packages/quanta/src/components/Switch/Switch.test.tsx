import React from 'react';
import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Switch } from './Switch';

expect.extend(toHaveNoViolations);

it('Switch toggles and is accessible', async () => {
  const onChange = vi.fn();
  const { container } = render(
    <Switch onChange={onChange} description="Editors can add it anywhere.">
      Globally addable
    </Switch>,
  );

  const control = screen.getByRole('switch', { name: 'Globally addable' });
  expect(control).not.toBeChecked();
  expect(control).toHaveAccessibleDescription('Editors can add it anywhere.');
  fireEvent.click(control);
  expect(control).toBeChecked();
  expect(onChange).toHaveBeenCalledWith(true);

  expect(await axe(container)).toHaveNoViolations();
});
