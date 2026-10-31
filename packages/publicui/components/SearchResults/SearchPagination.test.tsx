import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SearchPagination } from './SearchPagination';

const renderPagination = (
  props: { total: number; bStart: number; bSize: number },
  url = '/search?SearchableText=foo',
) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <SearchPagination {...props} />
    </MemoryRouter>,
  );

const pageLink = (page: number) =>
  screen.getByRole('link', { name: `publicui.search.pageLabel ${page}` });

describe('SearchPagination', () => {
  it('renders nothing when there is only one page', () => {
    renderPagination({ total: 10, bStart: 0, bSize: 25 });
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('renders a labeled navigation with a link per page', () => {
    renderPagination({ total: 60, bStart: 0, bSize: 25 });
    // 60 results / 25 => 3 pages
    expect(
      screen.getByRole('navigation', { name: 'publicui.search.pagination' }),
    ).toBeInTheDocument();
    expect(screen.getByText('1')).toHaveAttribute('aria-current', 'page');
    expect(pageLink(2)).toBeInTheDocument();
    expect(pageLink(3)).toBeInTheDocument();
    expect(screen.queryByText('4')).not.toBeInTheDocument();
  });

  it('marks the current page and preserves the query in links', () => {
    renderPagination(
      { total: 60, bStart: 25, bSize: 25 },
      '/search?SearchableText=foo&b_start=25',
    );

    // current page (page 2, index 1) is not a link
    const current = screen.getByText('2');
    expect(current.closest('a')).toBeNull();
    expect(current).toHaveAttribute('aria-current', 'page');

    // page 3 link keeps SearchableText and sets b_start, scoped to the route
    const href = pageLink(3).getAttribute('href') ?? '';
    expect(href).toContain('/search?');
    expect(href).toContain('SearchableText=foo');
    expect(href).toContain('b_start=50');

    // first page link drops b_start
    const firstHref = pageLink(1).getAttribute('href') ?? '';
    expect(firstHref).not.toContain('b_start');
    expect(firstHref).toContain('SearchableText=foo');
  });

  it('windows long page lists with ellipses around the current page', () => {
    renderPagination(
      { total: 250, bStart: 100, bSize: 25 },
      '/search?SearchableText=foo&b_start=100',
    );

    for (const page of ['1', '3', '4', '5', '6', '7', '10']) {
      expect(screen.getByText(page)).toBeInTheDocument();
    }
    for (const page of ['2', '8', '9']) {
      expect(screen.queryByText(page)).not.toBeInTheDocument();
    }
    expect(screen.getAllByText('…')).toHaveLength(2);
  });

  it('windows the edges with a single ellipsis', () => {
    renderPagination({ total: 250, bStart: 0, bSize: 25 });
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.queryByText('4')).not.toBeInTheDocument();
    expect(screen.getAllByText('…')).toHaveLength(1);
  });

  it('links previous and next, except past the first and last page', () => {
    const { rerender } = renderPagination({ total: 60, bStart: 0, bSize: 25 });
    expect(
      screen.queryByRole('link', { name: 'publicui.search.previous' }),
    ).toBeNull();
    expect(
      screen.getByRole('link', { name: 'publicui.search.next' }),
    ).toHaveAttribute('rel', 'next');

    rerender(
      <MemoryRouter initialEntries={['/search?SearchableText=foo&b_start=50']}>
        <SearchPagination total={60} bStart={50} bSize={25} />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('link', { name: 'publicui.search.previous' }),
    ).toHaveAttribute('rel', 'prev');
    expect(
      screen.queryByRole('link', { name: 'publicui.search.next' }),
    ).toBeNull();
  });
});
