import React from 'react';
import { expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Heading } from 'react-aria-components';
import { Drawer } from './Drawer';
import { Button } from '../Button/Button';
import { Dialog, DialogTrigger } from '../Dialog/Dialog';

expect.extend(toHaveNoViolations);

it('Drawer opens a dialog and is accessible', async () => {
  render(
    <DialogTrigger>
      <Button>Edit field</Button>
      <Drawer>
        <Dialog>
          {({ close }) => (
            <>
              <Heading slot="title">Edit field</Heading>
              <Button onPress={close}>Done</Button>
            </>
          )}
        </Dialog>
      </Drawer>
    </DialogTrigger>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Edit field' }));
  const dialog = screen.getByRole('dialog', { name: 'Edit field' });
  expect(dialog).toBeInTheDocument();
  expect(await axe(document.body)).toHaveNoViolations();
});
