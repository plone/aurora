import React from 'react';
import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Checkbox } from './Checkbox';
import { CheckboxGroup } from '../CheckboxGroup/CheckboxGroup';

expect.extend(toHaveNoViolations);

it('Checkbox toggles, describes itself and is accessible', async () => {
  const onChange = vi.fn();
  const { container } = render(
    <Checkbox
      className="custom"
      onChange={onChange}
      description="Hide it from the navigation."
    >
      Exclude from navigation
    </Checkbox>,
  );

  const control = screen.getByRole('checkbox', {
    name: 'Exclude from navigation',
  });
  expect(control).not.toBeChecked();
  expect(control).toHaveAccessibleDescription('Hide it from the navigation.');
  // Like in React Aria's starter, `className` styles the clickable label.
  expect(control.closest('label')).toHaveClass('custom');
  fireEvent.click(control);
  expect(control).toBeChecked();
  expect(onChange).toHaveBeenCalledWith(true);

  expect(await axe(container)).toHaveNoViolations();
});

it('Checkbox shows its error message when invalid', () => {
  render(
    <Checkbox isInvalid errorMessage="Accept the terms.">
      I accept the terms
    </Checkbox>,
  );

  expect(screen.getByText('Accept the terms.')).toBeInTheDocument();
});

it('Checkbox works inside a CheckboxGroup', () => {
  const onChange = vi.fn();
  render(
    <CheckboxGroup label="Days" onChange={onChange}>
      <Checkbox value="MO">Monday</Checkbox>
      <Checkbox value="TU">Tuesday</Checkbox>
    </CheckboxGroup>,
  );

  fireEvent.click(screen.getByRole('checkbox', { name: 'Tuesday' }));
  expect(onChange).toHaveBeenCalledWith(['TU']);
});
