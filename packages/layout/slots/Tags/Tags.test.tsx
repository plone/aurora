import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Tags from './Tags';

const renderTags = (subjects: string[]) =>
  render(
    <MemoryRouter>
      <Tags
        content={{ subjects } as never}
        location={{ pathname: '/' } as never}
      />
    </MemoryRouter>,
  );

describe('Tags slot', () => {
  it('renders nothing when there are no tags', () => {
    const { container } = renderTags([]);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a search link for each tag', () => {
    renderTags(['News', 'Plone & Co']);
    expect(screen.getByRole('link', { name: 'News' })).toHaveAttribute(
      'href',
      '/search?Subject=News',
    );
    expect(screen.getByRole('link', { name: 'Plone & Co' })).toHaveAttribute(
      'href',
      '/search?Subject=Plone%20%26%20Co',
    );
  });
});
