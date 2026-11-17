import React from 'react';
import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

it('Button basic a11y test', async () => {
  const { container } = render(<Button variant="primary">The button</Button>);

  const button = screen.getByText('The button');
  expect(button).toHaveRole('button');

  const results = await axe(container);

  expect(results).toHaveNoViolations();
});

it('Button with accent a11y test', async () => {
  const { container } = render(
    <Button variant="primary" accent>
      The button
    </Button>,
  );

  const button = screen.getByText('The button');
  expect(button).toHaveRole('button');

  const results = await axe(container);

  expect(results).toHaveNoViolations();
});

it('Button asLink a11y test', async () => {
  const { container } = render(
    <Button asLink variant="primary">
      The button as link
    </Button>,
  );

  const button = screen.getByText('The button as link');
  expect(button).toHaveRole('button');

  const results = await axe(container);

  expect(results).toHaveNoViolations();
});

it('Button shows a spinner and ignores presses while pending', () => {
  const onPress = vi.fn();
  render(
    <Button isPending onPress={onPress}>
      Save
    </Button>,
  );

  const button = screen.getByRole('button', { name: /Save/ });
  expect(button).toHaveTextContent('Save');
  expect(button.querySelector('.animate-spin')).toBeInTheDocument();
  fireEvent.click(button);
  expect(onPress).not.toHaveBeenCalled();
});
