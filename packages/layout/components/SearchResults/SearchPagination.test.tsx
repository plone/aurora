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

describe('SearchPagination', () => {
  it('renders nothing when there is only one page', () => {
    const { container } = renderPagination({ total: 10, bStart: 0, bSize: 25 });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a page link per page', () => {
    renderPagination({ total: 60, bStart: 0, bSize: 25 });
    // 60 results / 25 => 3 pages
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
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
    const thirdPage = screen.getByText('3').closest('a');
    expect(thirdPage).toHaveAttribute(
      'href',
      expect.stringContaining('/search?'),
    );
    expect(thirdPage).toHaveAttribute(
      'href',
      expect.stringContaining('SearchableText=foo'),
    );
    expect(thirdPage).toHaveAttribute(
      'href',
      expect.stringContaining('b_start=50'),
    );

    // first page link drops b_start
    const firstPage = screen.getByText('1').closest('a');
    expect(firstPage?.getAttribute('href')).not.toContain('b_start');
    expect(firstPage).toHaveAttribute(
      'href',
      expect.stringContaining('SearchableText=foo'),
    );
  });

  it('disables previous on the first page and next on the last', () => {
    const { rerender } = renderPagination({ total: 60, bStart: 0, bSize: 25 });
    expect(screen.getByText('‹').closest('a')).toBeNull();
    expect(screen.getByText('›').closest('a')).not.toBeNull();

    rerender(
      <MemoryRouter initialEntries={['/search?SearchableText=foo&b_start=50']}>
        <SearchPagination total={60} bStart={50} bSize={25} />
      </MemoryRouter>,
    );
    expect(screen.getByText('‹').closest('a')).not.toBeNull();
    expect(screen.getByText('›').closest('a')).toBeNull();
  });
});
