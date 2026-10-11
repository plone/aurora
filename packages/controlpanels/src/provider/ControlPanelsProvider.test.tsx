import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Link } from 'react-aria-components';
import {
  ControlPanelsProvider,
  useNotify,
  useTranslate,
} from './ControlPanelsProvider';

function Probe() {
  const translate = useTranslate();
  const notify = useNotify();
  return (
    <button onClick={() => notify({ title: 'Saved' })}>
      {translate(
        { id: 'probe', defaultMessage: 'Save {title}' },
        { title: 'Event' },
      )}
    </button>
  );
}

describe('ControlPanelsProvider', () => {
  it('works without any configuration', () => {
    render(<Probe />);
    expect(screen.getByRole('button')).toHaveTextContent('Save Event');
  });

  it('uses the app translations and notifications', () => {
    const notify = vi.fn();
    render(
      <ControlPanelsProvider
        translate={(message) => `[${message.id}]`}
        notify={notify}
      >
        <Probe />
      </ControlPanelsProvider>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('[probe]');
    expect(notify).toHaveBeenCalledWith({ title: 'Saved' });
  });

  it('sends links through the app router', () => {
    const navigate = vi.fn();
    render(
      <ControlPanelsProvider
        navigate={navigate}
        useHref={(path) => `/base${path}`}
      >
        <Link href="/controlpanel/content-types">Content types</Link>
      </ControlPanelsProvider>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/base/controlpanel/content-types');
    fireEvent.click(link);
    expect(navigate).toHaveBeenCalledWith(
      '/controlpanel/content-types',
      undefined,
    );
  });
});
