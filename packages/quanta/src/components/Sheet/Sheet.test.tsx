import React from 'react';
import { beforeAll, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Sheet } from './Sheet';
import { Button } from '../Button/Button';
import { DialogTrigger, Heading } from '../Dialog/Dialog';

// React Aria's Sheet observes its snap points, which jsdom doesn't support.
beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});

it('Sheet opens as a dialog and closes', () => {
  render(
    <DialogTrigger>
      <Button>Edit field</Button>
      <Sheet position="right">
        {({ close }) => (
          <>
            <Heading slot="title">Edit field</Heading>
            <Button onPress={close}>Done</Button>
          </>
        )}
      </Sheet>
    </DialogTrigger>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Edit field' }));
  const dialog = screen.getByRole('dialog', { name: 'Edit field' });
  expect(dialog).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
