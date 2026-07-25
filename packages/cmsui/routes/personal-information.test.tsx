import { expect, describe, it, vi, afterEach } from 'vitest';
import { RouterContextProvider } from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import {
  ploneClientContext,
  ploneUserContext,
} from '@plone/aurora/app/middleware.server';
import { loader, action } from './personal-information';

vi.mock('@plone/react-router', () => ({
  requireAuthCookie: vi.fn().mockResolvedValue('fake-token'),
}));

const mockUserschema = {
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: [
        'fullname',
        'email',
        'home_page',
        'description',
        'location',
        'portrait',
      ],
    },
  ],
  properties: {
    fullname: { title: 'Full Name', type: 'string' },
    email: { title: 'Email', type: 'string' },
    home_page: { title: 'Home page', type: 'string' },
    description: { title: 'Biography', type: 'string' },
    location: { title: 'Location', type: 'string' },
    portrait: { title: 'Portrait', type: 'object' },
  },
  required: ['email'],
};

const mockUser = {
  '@id': 'http://example.com/++api++/@users/john',
  id: 'john',
  username: 'john',
  fullname: 'John Doe',
  email: 'john@example.com',
  home_page: null,
  description: 'A test user',
  location: 'Kerpen',
  portrait: null,
  roles: ['Member'],
};

function buildContext(cli: Record<string, unknown>, user?: typeof mockUser) {
  const context = new RouterContextProvider();
  context.set(ploneClientContext, cli as any);
  if (user) {
    context.set(ploneUserContext, user as any);
  }
  return context;
}

describe('Personal information route', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('loader', () => {
    it('should return the user from context and the userschema', async () => {
      const getUserschemaMock = vi
        .fn()
        .mockResolvedValue({ data: mockUserschema });
      const context = buildContext(
        { getUserschema: getUserschemaMock },
        mockUser,
      );

      const request = new Request('http://example.com/@@personal-information');

      const result = await loader({
        request,
        params: {},
        context,
        unstable_pattern: '/@@personal-information',
        unstable_url: new URL(request.url),
      });

      expect(getUserschemaMock).toHaveBeenCalled();
      expect(result.user).toEqual(mockUser);
      expect(result.userschema).toEqual(mockUserschema);
    });

    it('should require an auth cookie', async () => {
      const context = buildContext(
        { getUserschema: vi.fn().mockResolvedValue({ data: mockUserschema }) },
        mockUser,
      );

      const request = new Request('http://example.com/@@personal-information');

      await loader({
        request,
        params: {},
        context,
        unstable_pattern: '/@@personal-information',
        unstable_url: new URL(request.url),
      });

      expect(requireAuthCookie).toHaveBeenCalledWith(request);
    });

    it('should propagate the redirect for unauthenticated requests', async () => {
      const redirectResponse = new Response(null, {
        status: 302,
        headers: { Location: '/login' },
      });
      vi.mocked(requireAuthCookie).mockRejectedValueOnce(redirectResponse);

      const context = buildContext({ getUserschema: vi.fn() });
      const request = new Request('http://example.com/@@personal-information');

      await expect(
        loader({
          request,
          params: {},
          context,
          unstable_pattern: '/@@personal-information',
          unstable_url: new URL(request.url),
        }),
      ).rejects.toBe(redirectResponse);
    });
  });

  describe('action', () => {
    function buildActionRequest(body: Record<string, string>) {
      return new Request('http://example.com/@@personal-information', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    function callAction(
      request: Request,
      cli: Record<string, unknown>,
      user?: typeof mockUser,
    ) {
      const context = buildContext(cli, user);
      return action({
        request,
        params: {},
        context,
        unstable_pattern: '/@@personal-information',
        unstable_url: new URL(request.url),
      });
    }

    it('should call updateUser with the user id and the submitted data', async () => {
      const updateUserMock = vi.fn().mockResolvedValue({});
      const body = { fullname: 'Jane Doe', email: 'jane@example.com' };

      await callAction(
        buildActionRequest(body),
        { updateUser: updateUserMock },
        mockUser,
      );

      expect(updateUserMock).toHaveBeenCalledWith({ id: 'john', data: body });
    });

    it('should return ok on success', async () => {
      const result = await callAction(
        buildActionRequest({ fullname: 'Jane Doe' }),
        { updateUser: vi.fn().mockResolvedValue({}) },
        mockUser,
      );

      expect(result).toEqual({ ok: true });
    });

    it('should return the error instead of throwing when updateUser rejects', async () => {
      const result = await callAction(
        buildActionRequest({ fullname: 'Jane Doe' }),
        { updateUser: vi.fn().mockRejectedValue(new Error('PATCH failed')) },
        mockUser,
      );

      expect(result).toEqual({ ok: false, error: 'PATCH failed' });
    });

    it('should skip updateUser and report an error when there is no user in context', async () => {
      const updateUserMock = vi.fn();

      const result = await callAction(buildActionRequest({ fullname: 'X' }), {
        updateUser: updateUserMock,
      });

      expect(updateUserMock).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false, error: 'No authenticated user' });
    });
  });

  describe('PersonalInformation component', () => {
    it('should render the title, schema fields, buttons and change-password link', async () => {
      // Reset module registry so doMock takes effect on fresh imports
      vi.resetModules();

      vi.doMock('@plone/react-router', () => ({
        requireAuthCookie: vi.fn().mockResolvedValue('fake-token'),
      }));

      const fetcherSubmit = vi.fn();

      vi.doMock('react-router', async (importOriginal) => {
        const actual = (await importOriginal()) as any;
        return {
          ...actual,
          useLoaderData: () => ({
            user: mockUser,
            userschema: mockUserschema,
          }),
          useFetcher: () => ({ state: 'idle', submit: fetcherSubmit }),
          useNavigate: () => vi.fn(),
        };
      });

      // mock the TanStack-form/Quanta-widget machinery
      let formOptions: any;
      vi.doMock('../components/Form/Form', () => ({
        useAppForm: (options: any) => {
          formOptions = options;
          return {
            handleSubmit: vi.fn(),
            AppField: ({ name, children }: any) =>
              children({
                name,
                state: { value: '', meta: { errors: [] } },
                Quanta: (props: any) => (
                  <input aria-label={props.label} name={props.name} />
                ),
              }),
          };
        },
      }));

      // Dynamic imports to pick up the mocks
      const { render, screen } = await import('@testing-library/react');
      const { default: PersonalInformationMocked } = await import(
        './personal-information'
      );

      render(<PersonalInformationMocked />);

      // useTranslation falls back to returning the key in tests
      expect(
        screen.getByRole('heading', { name: 'cmsui.personalInformation' }),
      ).toBeInTheDocument();

      for (const field of mockUserschema.fieldsets[0].fields) {
        expect(
          screen.getByLabelText(
            (mockUserschema.properties as Record<string, any>)[field].title,
          ),
        ).toBeInTheDocument();
      }

      expect(
        screen.getByRole('button', { name: 'cmsui.save' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'cmsui.cancel' }),
      ).toBeInTheDocument();

      const changePassword = screen.getByRole('link', {
        name: 'cmsui.changePassword',
      });
      // route from PR #109
      expect(changePassword).toHaveAttribute('href', '/reset-password');

      // the form is seeded with the loader's user
      expect(formOptions.defaultValues).toEqual(mockUser);

      // onSubmit submits only non-empty schema text fields,
      // never portrait or non-schema user props
      await formOptions.onSubmit({
        value: {
          ...mockUser,
          fullname: 'Jane Doe',
          home_page: '',
          portrait: 'data:image/png;base64,abc',
        },
      });

      expect(fetcherSubmit).toHaveBeenCalledWith(
        {
          fullname: 'Jane Doe',
          email: 'john@example.com',
          description: 'A test user',
          location: 'Kerpen',
        },
        { method: 'post', encType: 'application/json' },
      );
    });

    it('should show an alert on failed save, announce success, and disable Save while busy', async () => {
      vi.resetModules();

      vi.doMock('@plone/react-router', () => ({
        requireAuthCookie: vi.fn().mockResolvedValue('fake-token'),
      }));

      // mutable so each render below can see a different fetcher state
      let fetcherValue: any = {
        state: 'idle',
        submit: vi.fn(),
        data: { ok: false, error: 'PATCH failed' },
      };

      vi.doMock('react-router', async (importOriginal) => {
        const actual = (await importOriginal()) as any;
        return {
          ...actual,
          useLoaderData: () => ({
            user: mockUser,
            userschema: mockUserschema,
          }),
          useFetcher: () => fetcherValue,
          useNavigate: () => vi.fn(),
        };
      });

      vi.doMock('../components/Form/Form', () => ({
        useAppForm: () => ({
          handleSubmit: vi.fn(),
          AppField: ({ name, children }: any) =>
            children({
              name,
              state: { value: '', meta: { errors: [] } },
              Quanta: (props: any) => (
                <input aria-label={props.label} name={props.name} />
              ),
            }),
        }),
      }));

      const { render, screen } = await import('@testing-library/react');
      const { default: PersonalInformationMocked } = await import(
        './personal-information'
      );

      // drop leftovers from the previous component test
      document.body.innerHTML = '';

      // failed save: visible alert with the generic message, detail in title
      const failed = render(<PersonalInformationMocked />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('cmsui.saveError');
      expect(alert).toHaveAttribute('title', 'PATCH failed');
      expect(screen.getByRole('status')).toHaveTextContent('');
      failed.unmount();

      // successful save: no alert, live region announces
      fetcherValue = { state: 'idle', submit: vi.fn(), data: { ok: true } };
      const succeeded = render(<PersonalInformationMocked />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('cmsui.saveSuccess');
      succeeded.unmount();

      // in-flight submission: Save is disabled
      fetcherValue = { state: 'submitting', submit: vi.fn() };
      render(<PersonalInformationMocked />);
      expect(screen.getByRole('button', { name: 'cmsui.save' })).toBeDisabled();
    });
  });
});
