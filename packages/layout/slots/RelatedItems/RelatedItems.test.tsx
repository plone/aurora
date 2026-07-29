import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { RouterProvider } from 'react-aria-components';
import RelatedItems from './RelatedItems';

type Item = { '@id': string; title: string };

const renderRelatedItems = (relatedItems: Item[]) =>
  render(
    <MemoryRouter>
      <RouterProvider navigate={() => undefined}>
        <RelatedItems
          content={{ relatedItems } as never}
          location={{ pathname: '/' } as never}
        />
      </RouterProvider>
    </MemoryRouter>,
  );

describe('RelatedItems slot', () => {
  it('renders nothing when there are no related items', () => {
    const { container } = renderRelatedItems([]);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a link for each related item', () => {
    renderRelatedItems([
      { '@id': '/news/one', title: 'News One' },
      { '@id': '/events/two', title: 'Event Two' },
    ]);
    expect(screen.getByRole('link', { name: 'News One' })).toHaveAttribute(
      'href',
      '/news/one',
    );
    expect(screen.getByRole('link', { name: 'Event Two' })).toHaveAttribute(
      'href',
      '/events/two',
    );
  });
});
