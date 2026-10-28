import { fireEvent, render, screen } from '@testing-library/react';
import { DialogTrigger } from 'react-aria-components';
import { Button, Dialog, Modal } from '@plone/quanta';
import { ControlPanelsScope } from './ControlPanelsScope';

describe('ControlPanelsScope', () => {
  it('renders dialogs inside the scope', async () => {
    const { container } = render(
      <ControlPanelsScope className="extra">
        <DialogTrigger>
          <Button>Open</Button>
          <Modal>
            <Dialog aria-label="Inside">Content</Dialog>
          </Modal>
        </DialogTrigger>
      </ControlPanelsScope>,
    );
    const scope = container.querySelector('.plone-controlpanels.extra');
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(scope).toContainElement(
      await screen.findByRole('dialog', { name: 'Inside' }),
    );
  });
});
