import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { atom } from 'jotai';
import type { ReactNode } from 'react';
import config from '@plone/registry';
import ContentForm from './ContentForm';

const fetcher = vi.hoisted(() => ({
  state: 'idle',
  data: undefined as unknown,
  submit: vi.fn(),
}));

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useFetcher: () => fetcher,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@plone/layout/components/Pluggable', () => ({
  Plug: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@plone/icons/svg/checkbox.svg?react', () => ({ default: () => null }));
vi.mock('@plone/icons/svg/close.svg?react', () => ({ default: () => null }));
vi.mock('@plone/icons/svg/settings.svg?react', () => ({ default: () => null }));

vi.mock('../BlockEditor/BlocksEditor', () => ({
  default: () => <div data-testid="blocks-editor" />,
}));

vi.mock('../Sidebar/Sidebar', () => ({
  default: () => null,
  sidebarAtom: atom(false),
}));

// Renders the schema it receives, to check what reaches the fields.
vi.mock('../Form/SchemaFieldsets', () => ({
  default: ({ schema }: { schema: { properties: object } }) => (
    <pre data-testid="fields">{JSON.stringify(schema.properties)}</pre>
  ),
}));

const schema = {
  title: 'Page',
  fieldsets: [{ id: 'default', title: 'Default', fields: ['title'] }],
  properties: {
    title: { title: 'Title', type: 'string' },
    description: { title: 'Description', type: 'string' },
  },
  required: [],
} as any;

const content = { '@id': '/en/page', '@type': 'Document', title: 'Page' };

function renderForm(props: Record<string, unknown> = {}) {
  return render(
    <ContentForm
      content={content as any}
      path="/en/page"
      schema={schema}
      heading="Edit page"
      submitMethod="patch"
      {...props}
    />,
  );
}

const showContentTab = () =>
  fireEvent.click(
    screen.getByRole('tab', { name: 'cmsui.blocksEditor.contentTab' }),
  );

describe('ContentForm', () => {
  const showToast = vi.fn();

  beforeEach(() => {
    fetcher.data = undefined;
    config.registerUtility({ name: 'show', type: 'toast', method: showToast });
  });

  afterEach(() => {
    showToast.mockReset();
  });

  it('renders the aside panels next to the form', () => {
    renderForm({
      asidePanels: {
        header: <p>Source header</p>,
        blocks: <p>Source blocks</p>,
        content: <p>Source fields</p>,
      },
    });

    expect(screen.getByText('Source header')).toBeInTheDocument();
    expect(screen.getByText('Source blocks')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Edit page' })).toBeVisible();

    showContentTab();
    expect(screen.getByText('Source fields')).toBeInTheDocument();
  });

  it('passes the field placeholders to the fields through the schema', () => {
    renderForm({ fieldPlaceholders: { title: 'My Page' } });
    showContentTab();

    const properties = JSON.parse(screen.getByTestId('fields').textContent!);
    expect(properties.title.placeholder).toBe('My Page');
    expect(properties.description.placeholder).toBeUndefined();
  });

  it('cancels to the content, or to cancelHref when given', () => {
    const { unmount } = renderForm();
    expect(screen.getByLabelText('cmsui.cancel')).toHaveAttribute(
      'href',
      '/en/page',
    );
    unmount();

    renderForm({ content: { '@type': 'Document' }, cancelHref: '/en/source' });
    expect(screen.getByLabelText('cmsui.cancel')).toHaveAttribute(
      'href',
      '/en/source',
    );
  });

  it('shows an error that belongs to no field as a toast', () => {
    const { rerender } = renderForm();
    expect(showToast).not.toHaveBeenCalled();

    fetcher.data = { error: 'A translation in this language already exists' };
    act(() => {
      rerender(
        <ContentForm
          content={content as any}
          path="/en/page"
          schema={schema}
          heading="Edit page"
          submitMethod="patch"
        />,
      );
    });

    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'cmsui.saveFailed',
        description: 'A translation in this language already exists',
        className: 'error',
      }),
    );
  });
});
