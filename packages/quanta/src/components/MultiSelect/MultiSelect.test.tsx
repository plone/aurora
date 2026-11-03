import React, { useState } from 'react';
import { expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MultiSelect, type MultiSelectItem } from './MultiSelect';

const items: MultiSelectItem[] = [
  { id: 'apple', name: 'Apple' },
  { id: 'banana', name: 'Banana' },
];

function Controlled(props: { allowsCustomValue?: boolean }) {
  const [value, setValue] = useState<MultiSelectItem[]>([items[0]]);
  return (
    <>
      <MultiSelect
        label="Fruits"
        items={items}
        value={value}
        onChange={setValue}
        {...props}
      />
      <output>{value.map((item) => item.id).join(',')}</output>
    </>
  );
}

it('MultiSelect shows the selected items as tags and removes them', () => {
  render(<Controlled />);

  const tags = screen.getByRole('grid', { name: 'Fruits' });
  expect(tags).toHaveTextContent('Apple');
  fireEvent.click(screen.getByRole('button', { name: /remove/i }));
  expect(document.querySelector('output')).toHaveTextContent('');
});

it('MultiSelect adds a typed value only when custom values are allowed', () => {
  const { unmount } = render(<Controlled />);
  const input = screen.getByRole('combobox', { name: 'Fruits' });
  fireEvent.change(input, { target: { value: 'Papaya' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(document.querySelector('output')).toHaveTextContent('apple');
  unmount();

  render(<Controlled allowsCustomValue />);
  const creatable = screen.getByRole('combobox', { name: 'Fruits' });
  fireEvent.change(creatable, { target: { value: 'Papaya' } });
  fireEvent.keyDown(creatable, { key: 'Enter' });
  expect(document.querySelector('output')).toHaveTextContent('apple,Papaya');
});
