import React from 'react';
import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Menu, MenuItem, MenuSection } from './Menu';

it('MenuSection renders its title and items', () => {
  render(
    <Menu aria-label="Text">
      <MenuSection id="styles" title="Styles">
        <MenuItem id="bold">Bold</MenuItem>
      </MenuSection>
      <MenuSection
        id="align"
        title="Align"
        items={[{ id: 'left', name: 'Left' }]}
      >
        {(item: { id: string; name: string }) => (
          <MenuItem id={item.id}>{item.name}</MenuItem>
        )}
      </MenuSection>
    </Menu>,
  );

  expect(screen.getByText('Styles')).toBeInTheDocument();
  expect(screen.getByText('Align')).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Bold' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Left' })).toBeInTheDocument();
});
