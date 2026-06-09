import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SearchResults } from './SearchResults';

const items = [
  { '@id': '/news/a', title: 'Article A', description: 'About A' },
  { '@id': '/news/b', title: 'Article B', description: '' },
];

const renderResults = (data: unknown[]) =>
  render(
    <MemoryRouter>
      <SearchResults items={data as never} />
    </MemoryRouter>,
  );

describe('SearchResults', () => {
  it('links each result to its item', () => {
    renderResults(items);
    expect(screen.getByRole('link', { name: 'Article A' })).toHaveAttribute(
      'href',
      '/news/a',
    );
    expect(screen.getByRole('link', { name: 'Article B' })).toHaveAttribute(
      'href',
      '/news/b',
    );
  });

  it('shows the description when present', () => {
    renderResults(items);
    expect(screen.getByText('About A')).toBeInTheDocument();
  });

  it('renders nothing for an empty result set', () => {
    const { container } = renderResults([]);
    expect(container).toBeEmptyDOMElement();
  });
});
