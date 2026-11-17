import React from 'react';
import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CustomRadio, Radio, RadioGroup } from './RadioGroup';

expect.extend(toHaveNoViolations);

it('RadioGroup selects a Radio and is accessible', async () => {
  const onChange = vi.fn();
  const { container } = render(
    <RadioGroup label="Ends" onChange={onChange}>
      <Radio value="never">Never</Radio>
      <Radio value="count" description="Stops after a number of times.">
        After a number of times
      </Radio>
    </RadioGroup>,
  );

  const option = screen.getByRole('radio', { name: 'Never' });
  fireEvent.click(option);
  expect(option).toBeChecked();
  expect(onChange).toHaveBeenCalledWith('never');
  expect(
    screen.getByRole('radio', { name: 'After a number of times' }),
  ).toHaveAccessibleDescription('Stops after a number of times.');

  expect(await axe(container)).toHaveNoViolations();
});

it('CustomRadio selects its value', () => {
  const onChange = vi.fn();
  render(
    <RadioGroup aria-label="Size" onChange={onChange}>
      <CustomRadio value="s">S</CustomRadio>
      <CustomRadio value="l">L</CustomRadio>
    </RadioGroup>,
  );

  fireEvent.click(screen.getByRole('radio', { name: 'L' }));
  expect(onChange).toHaveBeenCalledWith('l');
});
