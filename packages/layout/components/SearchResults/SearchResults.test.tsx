import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SearchResults } from './SearchResults';

const items = [
  {
    '@id': '/news/a',
    '@type': 'News Item',
    title: 'Article A',
    description: 'About A',
    review_state: 'published',
    effective: '2024-03-15T10:00:00+00:00',
  },
  { '@id': '/news/b', title: 'Article B', description: '' },
];

const renderResults = (
  data: unknown[],
  { total = data.length, loading = false } = {},
) =>
  render(
    <MemoryRouter>
      <SearchResults items={data as never} total={total} loading={loading} />
    </MemoryRouter>,
  );

describe('SearchResults', () => {
  it('links each result title to its item', () => {
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

  it('renders no result articles for an empty result set', () => {
    const { container } = renderResults([], { total: 0 });
    expect(container.querySelectorAll('article')).toHaveLength(0);
  });

  it('renders an accessible results region and a status count', () => {
    renderResults(items);
    const region = screen.getByRole('region', { name: /resultsLabel/i });
    expect(region).toBeInTheDocument();
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-controls', 'search-result-items');
  });

  it('shows the formatted effective date as metadata', () => {
    renderResults(items);
    const first = screen
      .getByRole('link', { name: 'Article A' })
      .closest('article') as HTMLElement;
    // a localized date is rendered (year present), and not the 1969 placeholder
    expect(within(first).getByText(/2024/)).toBeInTheDocument();
  });

  it('does not render a redundant "read more" link', () => {
    const { container } = renderResults(items);
    expect(container.querySelector('a[aria-hidden="true"]')).toBeNull();
  });

  it('marks the region busy and shows the loading label while loading', () => {
    renderResults(items, { loading: true });
    expect(
      screen.getByRole('region', { name: /resultsLabel/i }),
    ).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(
      'layout.search.loading',
    );
  });
});
