import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { SearchSort, sortToQuery } from './SearchSort';

function LocationProbe() {
  const { search } = useLocation();
  return <output data-testid="location-search">{search}</output>;
}

const renderSort = (url = '/search?SearchableText=foo') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/search"
          element={
            <>
              <SearchSort />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe('sortToQuery', () => {
  it('omits sort_on for relevance / unknown / null', () => {
    expect(sortToQuery(null)).toEqual({});
    expect(sortToQuery('relevance')).toEqual({});
    expect(sortToQuery('whatever')).toEqual({});
  });

  it('maps date to effective descending', () => {
    expect(sortToQuery('date')).toEqual({
      sort_on: 'effective',
      sort_order: 'descending',
    });
  });

  it('maps title to sortable_title ascending', () => {
    expect(sortToQuery('title')).toEqual({
      sort_on: 'sortable_title',
      sort_order: 'ascending',
    });
  });
});

describe('SearchSort', () => {
  it('reflects the current sort from the URL', () => {
    renderSort('/search?SearchableText=foo&sort=title');
    expect(screen.getByRole('combobox')).toHaveValue('title');
  });

  it('defaults to relevance when no sort param is present', () => {
    renderSort();
    expect(screen.getByRole('combobox')).toHaveValue('relevance');
  });

  it('updates the sort param and resets paging on change', () => {
    renderSort('/search?SearchableText=foo&b_start=25');

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'date' },
    });

    const search = screen.getByTestId('location-search').textContent ?? '';
    expect(search).toContain('sort=date');
    expect(search).toContain('SearchableText=foo');
    expect(search).not.toContain('b_start');
  });

  it('removes the sort param when switching back to relevance', () => {
    renderSort('/search?SearchableText=foo&sort=title');

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'relevance' },
    });

    const search = screen.getByTestId('location-search').textContent ?? '';
    expect(search).not.toContain('sort');
    expect(search).toContain('SearchableText=foo');
  });
});
