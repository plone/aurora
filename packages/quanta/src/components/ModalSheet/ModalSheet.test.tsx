import React from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ModalSheet } from './ModalSheet';
import { Button } from '../Button/Button';
import { DialogTrigger, Heading } from '../Dialog/Dialog';

// React Aria's Sheet observes its snap points, which jsdom doesn't support.
beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});

function mockViewport(isNarrow: boolean) {
  const listeners = new Set<() => void>();
  let matches = isNarrow;
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  }));
  return (nextIsNarrow: boolean) => {
    matches = nextIsNarrow;
    act(() => listeners.forEach((listener) => listener()));
  };
}

function openModalSheet(className?: string) {
  render(
    <DialogTrigger>
      <Button>Rename</Button>
      <ModalSheet className={className}>
        {({ close }) => (
          <>
            <Heading slot="title">Rename item</Heading>
            <Button onPress={close}>Done</Button>
          </>
        )}
      </ModalSheet>
    </DialogTrigger>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
}

function sheetPanel() {
  return screen
    .getByRole('dialog', { name: 'Rename item' })
    .closest('[data-position]');
}

describe('ModalSheet', () => {
  it('is a centered modal on wide screens', () => {
    mockViewport(false);
    openModalSheet();
    expect(sheetPanel()).toHaveAttribute('data-position', 'center');

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a bottom sheet on narrow screens', () => {
    mockViewport(true);
    openModalSheet();
    expect(sheetPanel()).toHaveAttribute('data-position', 'bottom');
    expect(sheetPanel()).toHaveAttribute('data-swipe-direction', 'bottom');
  });

  it('keeps its position while open when the screen is resized', () => {
    const resize = mockViewport(true);
    openModalSheet();
    resize(false);
    expect(sheetPanel()).toHaveAttribute('data-position', 'bottom');

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    expect(sheetPanel()).toHaveAttribute('data-position', 'center');
  });

  it('sets its width from the --modal-max-width of its className', () => {
    mockViewport(false);
    openModalSheet('[--modal-max-width:360px]');
    expect(sheetPanel()).toHaveClass(
      'max-w-[min(90vw,var(--modal-max-width,600px))]',
    );
    // The custom property is set on an ancestor, so the panel inherits it.
    expect(
      sheetPanel()?.closest('.\\[--modal-max-width\\:360px\\]'),
    ).not.toBeNull();
  });
});
