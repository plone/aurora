import React from 'react';
import { expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Select, SelectItem, SelectSection } from './Select';

it('Select renders its items without children', () => {
  render(
    <Select
      label="Fruit"
      items={[
        { label: 'Apple', value: 'apple' },
        { label: 'Pear', value: 'pear' },
      ]}
    />,
  );

  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('option', { name: 'Pear' })).toBeInTheDocument();
});

it('SelectSection renders its title', () => {
  render(
    <Select label="Food">
      <SelectSection id="fruit" title="Fruit">
        <SelectItem id="apple">Apple</SelectItem>
      </SelectSection>
    </Select>,
  );

  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByText('Fruit')).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
});
