import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { SearchForm } from './SearchForm';

// <Form> needs a data router.
const renderForm = (url: string) =>
  render(
    <RouterProvider
      router={createMemoryRouter([{ path: '*', element: <SearchForm /> }], {
        initialEntries: [url],
      })}
    />,
  );

describe('SearchForm', () => {
  it('prefills the field with the current term', () => {
    renderForm('/search?SearchableText=plone');
    expect(screen.getByRole('searchbox')).toHaveValue('plone');
  });

  it('keeps the scope and sort order as hidden fields', () => {
    const { container } = renderForm(
      '/search?SearchableText=plone&path=/en&sort=date&b_start=25',
    );
    const hidden = Object.fromEntries(
      [...container.querySelectorAll('input[type="hidden"]')].map((input) => [
        (input as HTMLInputElement).name,
        (input as HTMLInputElement).value,
      ]),
    );
    expect(hidden).toEqual({ path: '/en', sort: 'date' });
  });

  it('renders a search landmark with a submit button', () => {
    renderForm('/search');
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'layout.search.submit' }),
    ).toHaveAttribute('type', 'submit');
  });
});
