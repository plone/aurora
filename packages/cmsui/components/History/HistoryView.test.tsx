import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from 'vitest';
import type { Content, GetHistoryResponse } from '@plone/types';
import HistoryView, { statusDotClass, formatRelativeTime } from './HistoryView';

const submitMock = vi.fn();

// Mutable so tests can simulate the fetcher lifecycle (submitting → result).
const fetcherState: { state: string; data: unknown } = {
  state: 'idle',
  data: undefined,
};

vi.mock('react-router', () => ({
  useFetcher: vi.fn(() => ({
    submit: (...args: unknown[]) => submitMock(...args),
    state: fetcherState.state,
    data: fetcherState.data,
  })),
}));

// Like the sibling cmsui tests, translations are not initialized; t() returns
// the raw key, so assertions reference the cmsui.history.* keys.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// vitest has no svgr transform for `?react` imports; replace the two raw
// icons of the revert dialog with plain placeholders.
vi.mock('@plone/components/icons/close.svg?react', () => ({
  default: () => <svg aria-hidden="true" />,
}));
vi.mock('@plone/components/icons/undo.svg?react', () => ({
  default: () => <svg aria-hidden="true" />,
}));

const versionedEntry = (
  overrides: Partial<GetHistoryResponse[number]> = {},
) => ({
  '@id': 'http://localhost/history-test/@history/1',
  action: 'Edited',
  actor: {
    '@id': 'http://localhost/@users/admin',
    fullname: 'Jane Editor',
    id: 'admin',
    username: 'admin',
  },
  comments: 'Fixed a typo',
  may_revert: true,
  time: '2026-06-10T12:00:00+00:00',
  transition_title: 'Edited',
  type: 'versioning',
  version: 1,
  ...overrides,
});

const workflowEntry = (overrides: Record<string, unknown> = {}) => ({
  action: 'publish',
  actor: {
    '@id': 'http://localhost/@users/admin',
    fullname: 'Jane Editor',
    id: 'admin',
    username: 'admin',
  },
  comments: '',
  review_state: 'published',
  state_title: 'Published',
  time: '2026-06-10T11:00:00+00:00',
  transition_title: 'Publish',
  type: 'workflow',
  ...overrides,
});

const content = {
  '@id': '/history-test',
  title: 'History Test Page',
  '@components': {
    breadcrumbs: {
      root: '/',
      items: [{ '@id': '/history-test', title: 'History Test Page' }],
    },
  },
} as unknown as Content;

describe('statusDotClass', () => {
  it('marks versioning entries green', () => {
    expect(statusDotClass(versionedEntry() as never)).toBe('bg-quanta-neon');
  });

  it('colors workflow entries by review state', () => {
    expect(
      statusDotClass(workflowEntry({ review_state: 'published' }) as never),
    ).toBe('bg-quanta-cobalt');
    expect(
      statusDotClass(workflowEntry({ review_state: 'private' }) as never),
    ).toBe('bg-quanta-rose');
    expect(
      statusDotClass(workflowEntry({ review_state: 'pending' }) as never),
    ).toBe('bg-quanta-pigeon');
  });
});

describe('formatRelativeTime', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-10T12:00:00+00:00'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('formats past times in the given locale', () => {
    expect(formatRelativeTime('2026-06-10T11:58:00+00:00', 'en')).toBe(
      '2 minutes ago',
    );
    expect(formatRelativeTime('2026-06-10T07:00:00+00:00', 'en')).toBe(
      '5 hours ago',
    );
    expect(formatRelativeTime('2026-06-05T12:00:00+00:00', 'de')).toBe(
      'vor 5 Tagen',
    );
  });

  it('returns the input for unparsable dates', () => {
    expect(formatRelativeTime('not-a-date', 'en')).toBe('not-a-date');
  });
});

describe('HistoryView', () => {
  const history = [
    versionedEntry({ version: 2, comments: 'Latest edit' }),
    versionedEntry(),
    workflowEntry(),
  ] as GetHistoryResponse;

  beforeEach(() => {
    submitMock.mockClear();
    fetcherState.state = 'idle';
    fetcherState.data = undefined;
  });

  it('renders the title, breadcrumbs, and one row per entry', async () => {
    const { container } = render(
      <HistoryView content={content} history={history} />,
    );

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'cmsui.history.changesTo',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /cmsui\.history\.home/ }),
    ).toHaveAttribute('href', '/');
    // one row per history entry plus the header row
    expect(screen.getAllByRole('row')).toHaveLength(history.length + 1);
    // actions menu only on versioning rows
    expect(
      screen.getAllByRole('button', { name: 'cmsui.history.actions' }),
    ).toHaveLength(2);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('asks for confirmation before submitting a revert', async () => {
    render(<HistoryView content={content} history={history} />);

    // the newest versioning entry is current: no revert item in its menu
    const [currentMenu, oldMenu] = screen.getAllByRole('button', {
      name: 'cmsui.history.actions',
    });
    fireEvent.click(currentMenu);
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /cmsui\.history\.revert/ }),
    ).not.toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'Escape',
    });

    // an older revertable version opens the confirmation dialog
    fireEvent.click(oldMenu);
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /cmsui\.history\.revert/,
      }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('cmsui.history.modalRevert.title');
    expect(submitMock).not.toHaveBeenCalled();

    // confirming submits the version to the route action
    fireEvent.click(
      screen.getByRole('button', { name: 'cmsui.history.modalRevert.confirm' }),
    );
    expect(submitMock).toHaveBeenCalledWith(
      { version: '1' },
      { method: 'post' },
    );
  });

  it('survives entries with an unparsable time', () => {
    render(
      <HistoryView
        content={content}
        history={
          [
            versionedEntry({ time: 'not-a-date' }),
          ] as unknown as GetHistoryResponse
        }
      />,
    );

    // the raw value is shown instead of crashing on Invalid Date
    expect(screen.getByText('not-a-date')).toBeInTheDocument();
  });

  it('keeps the dialog open during submit and shows a message on failure', async () => {
    const view = render(<HistoryView content={content} history={history} />);

    const [, oldMenu] = screen.getAllByRole('button', {
      name: 'cmsui.history.actions',
    });
    fireEvent.click(oldMenu);
    fireEvent.click(
      await screen.findByRole('menuitem', { name: /cmsui\.history\.revert/ }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'cmsui.history.modalRevert.confirm' }),
    );

    // while the revert is in flight, the dialog stays open and confirm is
    // disabled
    fetcherState.state = 'submitting';
    view.rerender(<HistoryView content={content} history={history} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'cmsui.history.modalRevert.confirm' }),
    ).toBeDisabled();

    // a failed action keeps it open and shows the error message
    fetcherState.state = 'idle';
    fetcherState.data = { ok: false, error: 'revertFailed' };
    view.rerender(<HistoryView content={content} history={history} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'cmsui.history.modalRevert.error',
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // a successful action closes the dialog
    fetcherState.data = { ok: true };
    view.rerender(<HistoryView content={content} history={history} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
