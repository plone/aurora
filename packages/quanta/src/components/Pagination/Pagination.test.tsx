import React from 'react';
import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Pagination } from './Pagination';

expect.extend(toHaveNoViolations);

function pageNames() {
  return screen
    .getAllByRole('button')
    .map((button) => button.getAttribute('aria-label'));
}

it('Pagination shows the pages around the current one and is accessible', async () => {
  const onPageChange = vi.fn();
  const { container } = render(
    <Pagination totalPages={10} currentPage={5} onPageChange={onPageChange} />,
  );

  expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
  expect(pageNames()).toEqual([
    'Previous page',
    'Page 1',
    'Page 4',
    'Page 5',
    'Page 6',
    'Page 7',
    'Page 8',
    'Page 9',
    'Page 10',
    'Next page',
  ]);
  expect(screen.getByRole('button', { name: 'Page 6' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  fireEvent.click(screen.getByRole('button', { name: 'Page 8' }));
  expect(onPageChange).toHaveBeenLastCalledWith(7);
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(onPageChange).toHaveBeenLastCalledWith(6);

  expect(await axe(container)).toHaveNoViolations();
});

it('Pagination replaces two or more hidden pages with an ellipsis', () => {
  render(
    <Pagination totalPages={20} currentPage={10} onPageChange={vi.fn()} />,
  );

  expect(pageNames()).toEqual([
    'Previous page',
    'Page 1',
    'Page 9',
    'Page 10',
    'Page 11',
    'Page 12',
    'Page 13',
    'Page 20',
    'Next page',
  ]);
  expect(screen.getAllByText('…')).toHaveLength(2);
});

it('Pagination shows a page instead of an ellipsis for a one-page gap', () => {
  render(<Pagination totalPages={7} currentPage={3} onPageChange={vi.fn()} />);

  expect(pageNames()).toEqual([
    'Previous page',
    'Page 1',
    'Page 2',
    'Page 3',
    'Page 4',
    'Page 5',
    'Page 6',
    'Page 7',
    'Next page',
  ]);
  expect(screen.queryByText('…')).not.toBeInTheDocument();
});

it('Pagination disables previous on the first page and next on the last', () => {
  const { rerender } = render(
    <Pagination totalPages={3} currentPage={0} onPageChange={vi.fn()} />,
  );
  expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

  rerender(
    <Pagination totalPages={3} currentPage={2} onPageChange={vi.fn()} />,
  );
  expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
});

it('Pagination renders nothing for a single page', () => {
  const { container } = render(
    <Pagination totalPages={1} onPageChange={vi.fn()} />,
  );
  expect(container).toBeEmptyDOMElement();
});
