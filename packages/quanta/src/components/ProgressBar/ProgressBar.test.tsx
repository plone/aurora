import React from 'react';
import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ProgressBar } from './ProgressBar';

expect.extend(toHaveNoViolations);

it('ProgressBar shows its value and is accessible', async () => {
  const { container } = render(
    <ProgressBar label="Changing workflow…" value={40} />,
  );

  const bar = screen.getByRole('progressbar', { name: 'Changing workflow…' });
  expect(bar).toHaveAttribute('aria-valuenow', '40');
  expect(screen.getByText('40%')).toBeInTheDocument();

  expect(await axe(container)).toHaveNoViolations();
});

it('ProgressBar hides the value while indeterminate', () => {
  render(<ProgressBar label="Loading" isIndeterminate />);
  expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  expect(screen.queryByText('%', { exact: false })).not.toBeInTheDocument();
});
