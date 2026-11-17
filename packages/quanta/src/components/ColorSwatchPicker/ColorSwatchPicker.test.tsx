import React from 'react';
import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ColorSwatchPicker, ColorSwatchPickerItem } from './ColorSwatchPicker';

expect.extend(toHaveNoViolations);

it('ColorSwatchPicker selects a color and is accessible', async () => {
  const onChange = vi.fn();
  const { container } = render(
    <ColorSwatchPicker
      aria-label="Background color"
      defaultValue="#021322"
      onChange={onChange}
    >
      <ColorSwatchPickerItem color="#021322" />
      <ColorSwatchPickerItem color="#0b78d0" />
    </ColorSwatchPicker>,
  );

  const picker = screen.getByRole('listbox', { name: 'Background color' });
  const [dark, blue] = Array.from(picker.querySelectorAll('[role="option"]'));
  expect(dark).toHaveAttribute('aria-selected', 'true');

  fireEvent.click(blue);
  expect(blue).toHaveAttribute('aria-selected', 'true');
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange.mock.calls[0][0].toString('hex')).toBe('#0B78D0');

  expect(await axe(container)).toHaveNoViolations();
});
