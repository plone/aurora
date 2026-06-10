import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { SearchFacets, aggregateFacets } from './SearchFacets';

function LocationProbe() {
  const { search } = useLocation();
  return <output data-testid="location-search">{search}</output>;
}

const facets = [
  { subject: 'news', count: 3 },
  { subject: 'sport', count: 2 },
];

const renderFacets = (url = '/search?SearchableText=foo') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/search"
          element={
            <>
              <SearchFacets facets={facets} />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe('aggregateFacets', () => {
  it('counts subjects and orders by count then name', () => {
    const result = aggregateFacets([
      { Subject: ['news', 'sport'] },
      { Subject: ['news'] },
      { Subject: ['sport', 'politics'] },
      { Subject: [] },
    ]);
    expect(result).toEqual([
      { subject: 'news', count: 2 },
      { subject: 'sport', count: 2 },
      { subject: 'politics', count: 1 },
    ]);
  });

  it('returns an empty list when there are no subjects', () => {
    expect(aggregateFacets([{ Subject: [] }])).toEqual([]);
  });
});

describe('SearchFacets', () => {
  it('renders nothing when there are no facets', () => {
    const { container } = render(
      <MemoryRouter>
        <SearchFacets facets={[]} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('is collapsed by default and toggles open/closed with the button', () => {
    renderFacets();
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('is expanded by default when a tag filter is already active', () => {
    renderFacets('/search?SearchableText=foo&Subject=news');
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders a checkbox with a count per facet', () => {
    renderFacets();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('checkbox', { name: /news/ })).not.toBeChecked();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('reflects the active Subject filters from the URL', () => {
    renderFacets('/search?SearchableText=foo&Subject=news');
    expect(screen.getByRole('checkbox', { name: /news/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /sport/ })).not.toBeChecked();
  });

  it('adds a Subject and resets paging when toggled on', () => {
    renderFacets('/search?SearchableText=foo&b_start=25');
    fireEvent.click(screen.getByRole('button'));

    fireEvent.click(screen.getByRole('checkbox', { name: /sport/ }));

    const search = screen.getByTestId('location-search').textContent ?? '';
    expect(search).toContain('Subject=sport');
    expect(search).toContain('SearchableText=foo');
    expect(search).not.toContain('b_start');
  });

  it('removes a Subject when toggled off but keeps the others', () => {
    renderFacets('/search?SearchableText=foo&Subject=news&Subject=sport');

    fireEvent.click(screen.getByRole('checkbox', { name: /news/ }));

    const search = screen.getByTestId('location-search').textContent ?? '';
    expect(search).not.toContain('Subject=news');
    expect(search).toContain('Subject=sport');
  });
});
