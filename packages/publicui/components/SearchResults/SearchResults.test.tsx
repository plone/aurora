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
  { total = data.length, loading = false, query = '', bStart = 0 } = {},
) =>
  render(
    <MemoryRouter>
      <SearchResults
        items={data as never}
        total={total}
        query={query}
        bStart={bStart}
        loading={loading}
      />
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

  it('renders the empty state for an empty result set', () => {
    const { container } = renderResults([], { total: 0, query: 'zzz' });
    expect(container.querySelectorAll('article')).toHaveLength(0);
    expect(
      screen.getByText('publicui.search.nothingFound'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'publicui.search.noResultsFor',
    );
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('counts without a term when the search is empty', () => {
    renderResults(items);
    expect(screen.getByRole('status')).toHaveTextContent(
      'publicui.search.resultCount',
    );
    expect(screen.getByRole('status')).not.toHaveTextContent(
      'publicui.search.resultCountFor',
    );
  });

  it('shows the sort control next to the count', () => {
    renderResults(items);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('adds the shown range when the results span several pages', () => {
    renderResults(items, { total: 60, bStart: 25 });
    expect(screen.getByRole('status')).toHaveTextContent(
      'publicui.search.showing',
    );
  });

  it('omits the shown range when all results fit on one page', () => {
    renderResults(items);
    expect(screen.getByRole('status')).not.toHaveTextContent(
      'publicui.search.showing',
    );
  });

  it('highlights the search terms in titles and descriptions', () => {
    const { container } = renderResults(items, { query: 'article A*' });
    const marks = [...container.querySelectorAll('mark')].map(
      (mark) => mark.textContent,
    );
    expect(marks).toContain('Article');
    expect(marks).toContain('A');
    // the link name is unchanged by the highlighting
    expect(screen.getByRole('link', { name: 'Article A' })).toBeInTheDocument();
  });

  it('shows the content type label', () => {
    renderResults([{ ...items[0], type_title: 'News' }]);
    expect(screen.getByText('News')).toBeInTheDocument();
  });

  it('renders an accessible results region and a status count', () => {
    renderResults(items);
    const region = screen.getByRole('region', { name: /resultsLabel/i });
    expect(region).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows the formatted effective date as metadata', () => {
    renderResults(items);
    const first = screen
      .getByRole('link', { name: 'Article A' })
      .closest('article') as HTMLElement;
    // a localized date is rendered (year present), and not the 1969 placeholder
    expect(within(first).getByText(/2024/)).toBeInTheDocument();
  });

  it('suppresses the Plone placeholder date', () => {
    renderResults([
      {
        '@id': '/news/c',
        title: 'Article C',
        description: '',
        effective: '1969-12-31T00:00:00+00:00',
      },
    ]);
    const article = screen
      .getByRole('link', { name: 'Article C' })
      .closest('article') as HTMLElement;
    expect(within(article).queryByText(/1969/)).toBeNull();
  });

  it('keeps a real date from 1970', () => {
    renderResults([
      {
        '@id': '/news/d',
        title: 'Article D',
        description: '',
        effective: '1970-06-15T00:00:00+00:00',
      },
    ]);
    const article = screen
      .getByRole('link', { name: 'Article D' })
      .closest('article') as HTMLElement;
    expect(within(article).getByText(/1970/)).toBeInTheDocument();
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
      'publicui.search.loading',
    );
  });
});
