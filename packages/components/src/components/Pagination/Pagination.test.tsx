import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Pagination } from './Pagination';

expect.extend(toHaveNoViolations);

const getPageHref = (page: number) => `/search?b_start=${page * 10}`;

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(
      <Pagination totalPages={1} currentPage={0} onPageChange={() => {}} />,
    );
    expect(container.querySelector('nav')).toBeNull();
  });

  it('calls onPageChange with the page in button mode', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination totalPages={5} currentPage={1} onPageChange={onPageChange} />,
    );
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  describe('with getPageHref', () => {
    it('renders the pages as links with their address', () => {
      render(
        <Pagination totalPages={5} currentPage={1} getPageHref={getPageHref} />,
      );
      expect(screen.queryAllByRole('button')).toHaveLength(0);
      expect(screen.getByRole('link', { name: 'Page 3' })).toHaveAttribute(
        'href',
        '/search?b_start=20',
      );
    });

    it('marks the current page, which is not a link', () => {
      render(
        <Pagination totalPages={5} currentPage={1} getPageHref={getPageHref} />,
      );
      const current = screen.getByText('2');
      expect(current.closest('a')).toBeNull();
      expect(current).toHaveAttribute('aria-current', 'page');
    });

    it('links the previous and next pages with rel', () => {
      render(
        <Pagination totalPages={5} currentPage={2} getPageHref={getPageHref} />,
      );
      expect(
        screen.getByRole('link', { name: 'Previous page' }),
      ).toHaveAttribute('rel', 'prev');
      expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute(
        'href',
        '/search?b_start=30',
      );
    });

    it('does not link past the first and the last page', () => {
      const { rerender } = render(
        <Pagination totalPages={3} currentPage={0} getPageHref={getPageHref} />,
      );
      expect(screen.queryByRole('link', { name: 'Previous page' })).toBeNull();
      rerender(
        <Pagination totalPages={3} currentPage={2} getPageHref={getPageHref} />,
      );
      expect(screen.queryByRole('link', { name: 'Next page' })).toBeNull();
    });

    it('shows the previous and next labels when asked', () => {
      render(
        <Pagination
          totalPages={5}
          currentPage={2}
          getPageHref={getPageHref}
          prevLabel="Previous"
          nextLabel="Next"
          showPrevNextLabels
        />,
      );
      expect(screen.getByRole('link', { name: 'Previous' })).toHaveTextContent(
        'Previous',
      );
      expect(screen.getByRole('link', { name: 'Next' })).toHaveTextContent(
        'Next',
      );
    });

    it('collapses long page lists with ellipses', () => {
      render(
        <Pagination
          totalPages={20}
          currentPage={10}
          getPageHref={getPageHref}
        />,
      );
      expect(screen.getAllByText('…')).toHaveLength(2);
      expect(screen.getByRole('link', { name: 'Page 1' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Page 20' })).toBeInTheDocument();
    });

    it('has no accessibility violations', async () => {
      const { container } = render(
        <Pagination totalPages={8} currentPage={3} getPageHref={getPageHref} />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
