import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
  useParams,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  RouterContextProvider,
  type MetaFunction,
} from 'react-router';
import {
  ploneClientContext,
  ploneContentContext,
} from '@plone/aurora/app/middleware.server';
import { redirectIfLoggedInLoader } from '@plone/react-router';
import { TextField, Link, Button } from '@plone/quanta';
import CloseSVG from '@plone/icons/svg/close.svg?react';
import ArrowRightSVG from '@plone/icons/svg/arrow-right.svg?react';
import SlotRenderer from '@plone/layout/slots/SlotRenderer';
import { useTranslation } from 'react-i18next';
import type { RootLoader } from '@plone/aurora/app/root';

export async function loader(args: LoaderFunctionArgs<RouterContextProvider>) {
  await redirectIfLoggedInLoader(args);
  const content = args.context.get(ploneContentContext);
  return { content };
}

export function headers() {
  return { 'Referrer-Policy': 'no-referrer' };
}

export const meta: MetaFunction<unknown, { root: RootLoader }> = ({
  matches,
}) => {
  const rootData = matches.find((match) => match.id === 'root')?.loaderData;
  const siteTitle = rootData?.site?.['plone.site_title'];
  return [
    {
      title: siteTitle ? `Reset password - ${siteTitle}` : 'Reset password',
    },
  ];
};

// TODO: Acquire the real password policy (length/complexity) from the Plone.
// REST API instead of hard-coding it. Plone remains the authoritative check.
const MIN_PASSWORD_LENGTH = 8;
const USERNAME_MIN_LENGTH = 2;

// Mirror of Plone's @controlpanels/security `use_email_as_login` setting.
// When false (Plone default), only the canonical username is accepted as the
// path segment in @users/{id}/reset-password.
// Flip to true if your Plone install enables email-as-login.
// TODO: Acquire setting from Plone directly.
const USE_EMAIL_AS_LOGIN = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ValidationFailure = {
  code: string;
  params?: Record<string, number | string>;
} | null;

export function validateIdentifier(value: string): ValidationFailure {
  const v = value.trim();
  if (!v) return { code: 'identifierRequired' };
  if (v.includes('@')) {
    if (!USE_EMAIL_AS_LOGIN) return { code: 'usernameNoEmail' };
    return EMAIL_RE.test(v) ? null : { code: 'invalidEmail' };
  }
  if (v.length < USERNAME_MIN_LENGTH) {
    return { code: 'usernameTooShort', params: { min: USERNAME_MIN_LENGTH } };
  }
  if (/\s/.test(v)) return { code: 'usernameNoSpaces' };
  return null;
}

export function validatePassword(value: string): ValidationFailure {
  if (value.length < MIN_PASSWORD_LENGTH) {
    return { code: 'passwordTooShort', params: { min: MIN_PASSWORD_LENGTH } };
  }
  return null;
}

export function validatePasswordMatch(
  password: string,
  confirm: string,
): ValidationFailure {
  if (password !== confirm) return { code: 'passwordsDoNotMatch' };
  return null;
}

type ResetPasswordMode = 'request' | 'set';

type ResetPasswordActionResult =
  | { ok: true; mode: ResetPasswordMode }
  | {
      ok: false;
      mode: ResetPasswordMode;
      code: string;
      params?: Record<string, number | string>;
    };

// plone.restapi answers 403 for an unknown or expired token, and 400 with the
// "Invalid password" type when the password policy rejects the new password.
function setPasswordFailure(error: any): NonNullable<ValidationFailure> {
  const status = Number(error?.status) || 500;
  if (status >= 500) return { code: 'serverError' };
  const ploneError = error?.data?.error;
  if (status === 400 && ploneError?.type === 'Invalid password') {
    return {
      code: 'passwordRejected',
      params: { message: String(ploneError.message ?? '') },
    };
  }
  return { code: 'setFailed' };
}

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  const cli = context.get(ploneClientContext);
  const formData = await request.formData();
  const mode: ResetPasswordMode =
    formData.get('mode') === 'set' ? 'set' : 'request';
  const id = String(formData.get('usernameOrEmail') || '').trim();

  const fail = (failure: NonNullable<ValidationFailure>) =>
    ({ ok: false, mode, ...failure }) satisfies ResetPasswordActionResult;

  const idError = validateIdentifier(id);
  if (idError) return fail(idError);

  // The id becomes a path segment of @users/{id}/reset-password.
  const encodedId = encodeURIComponent(id);

  if (mode === 'set') {
    const reset_token = String(formData.get('token') || '');
    const new_password = String(formData.get('new_password') || '');
    const confirm = String(formData.get('confirm_password') || '');

    if (!reset_token) return fail({ code: 'setFailed' });
    const passwordError = validatePassword(new_password);
    if (passwordError) return fail(passwordError);
    const matchError = validatePasswordMatch(new_password, confirm);
    if (matchError) return fail(matchError);

    try {
      await cli.resetPasswordWithToken({
        id: encodedId,
        data: { reset_token, new_password },
      });
      return { ok: true, mode } satisfies ResetPasswordActionResult;
    } catch (error: any) {
      return fail(setPasswordFailure(error));
    }
  }

  try {
    await cli.resetPassword({ id: encodedId });
  } catch (error: any) {
    // Any 4xx is reported as success so the response does not reveal
    // whether an account exists.
    const status = Number(error?.status) || 500;
    if (status >= 500) return fail({ code: 'serverError' });
  }
  return { ok: true, mode } satisfies ResetPasswordActionResult;
}

function ResetPasswordLayout({ children }: { children: ReactNode }) {
  const { content } = useLoaderData<typeof loader>();
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <main
      className={`
        grid min-h-screen
        lg:has-[>*:nth-child(2)]:grid-cols-[minmax(50%,1fr)_auto]
      `}
    >
      <div className="flex h-full flex-col justify-center p-15">
        <div className="relative flex h-full flex-1 flex-col items-center justify-center">
          <Link
            className="absolute top-0 right-0"
            variant="icon"
            accent
            size="L"
            href="/"
            aria-label={t('cmsui.auth.returnToHome')}
            asButton
          >
            <CloseSVG />
          </Link>
          {children}
        </div>
      </div>
      <div
        className={`
          hidden
          lg:block
        `}
      >
        <SlotRenderer name="loginHero" content={content} location={location} />
      </div>
    </main>
  );
}

export default function ResetPassword() {
  const { content } = useLoaderData<typeof loader>();
  const actionResult = useActionData<typeof action>() as
    ResetPasswordActionResult | undefined;
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const token = params.token ?? '';
  const hasToken = token.length > 0;
  // Plone's reset email links to /passwordreset/<token>?userid=<id>.
  const userIdFromLink = searchParams.get('userid') ?? undefined;

  const [newPassword, setNewPassword] = useState('');

  const succeeded = actionResult?.ok === true;

  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (succeeded) successHeadingRef.current?.focus();
  }, [succeeded]);

  const translateFailure = (failure: NonNullable<ValidationFailure>) =>
    t(`cmsui.auth.resetPassword.errors.${failure.code}`, failure.params);

  // Server errors are plain markup, not field validity: React Aria would keep
  // a server-set invalid state as custom validity and block every resubmit.
  const formError =
    actionResult && !actionResult.ok ? translateFailure(actionResult) : null;

  const runValidator =
    (validator: (value: string) => ValidationFailure) =>
    (value: string): string | null => {
      const failure = validator(value);
      return failure ? translateFailure(failure) : null;
    };

  const identifierVariant = USE_EMAIL_AS_LOGIN ? 'WithEmail' : '';
  const identifierLabel = USE_EMAIL_AS_LOGIN
    ? t('cmsui.auth.usernameOrEmail')
    : t('cmsui.auth.username');

  if (succeeded) {
    const isRequest = actionResult.mode === 'request';
    const successTitle = isRequest
      ? t('cmsui.auth.resetPassword.requestSuccessTitle')
      : t('cmsui.auth.resetPassword.setSuccessTitle');
    const successBody = isRequest
      ? t(`cmsui.auth.resetPassword.requestSuccessBody${identifierVariant}`)
      : t('cmsui.auth.resetPassword.setSuccessBody');

    return (
      <ResetPasswordLayout>
        <div
          className={`
            flex flex-col items-center
            sm:mx-auto sm:w-full sm:max-w-md
          `}
          role="status"
          aria-live="polite"
        >
          <SlotRenderer
            name="loginLogo"
            content={content}
            location={location}
          />
          <h2
            ref={successHeadingRef}
            tabIndex={-1}
            className={`mt-6 text-center text-2xl leading-8 font-bold tracking-wide text-gray-900`}
          >
            {successTitle}
          </h2>
          <p className="mt-4 text-center text-sm text-quanta-iron">
            {successBody}
          </p>
          <div className="mt-6">
            <Link href="/login">{t('cmsui.auth.signIn')}</Link>
          </div>
        </div>
      </ResetPasswordLayout>
    );
  }

  const heading = hasToken
    ? t('cmsui.auth.resetPassword.setTitle')
    : t('cmsui.auth.resetPassword.requestTitle');

  const description = hasToken
    ? t('cmsui.auth.resetPassword.setDescription')
    : t(`cmsui.auth.resetPassword.requestDescription${identifierVariant}`);

  return (
    <ResetPasswordLayout>
      <div
        className={`
          flex flex-col items-center
          sm:mx-auto sm:w-full sm:max-w-md
        `}
      >
        <SlotRenderer name="loginLogo" content={content} location={location} />
        <h2
          id="reset-password-header"
          className={`mt-6 text-center text-2xl leading-8 font-bold tracking-wide text-gray-900`}
        >
          {heading}
        </h2>
        <p className="mt-3 text-center text-sm text-quanta-iron">
          {description}
        </p>
      </div>
      <div className="mx-auto mt-11 w-full max-w-90">
        <div className="bg-quanta-air">
          <Form
            className="space-y-6"
            method="post"
            aria-labelledby="reset-password-header"
          >
            <input
              type="hidden"
              name="mode"
              value={hasToken ? 'set' : 'request'}
            />
            {hasToken && <input type="hidden" name="token" value={token} />}
            {formError && (
              <div
                role="alert"
                className={`rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800`}
              >
                {formError}
              </div>
            )}
            <TextField
              label={identifierLabel}
              name="usernameOrEmail"
              autoComplete="username"
              isRequired
              defaultValue={hasToken ? userIdFromLink : undefined}
              validate={runValidator(validateIdentifier)}
              description={
                hasToken
                  ? t(
                      `cmsui.auth.resetPassword.setIdentifierHint${identifierVariant}`,
                    )
                  : undefined
              }
            />
            {hasToken && (
              <>
                <TextField
                  label={t('cmsui.auth.resetPassword.newPassword')}
                  name="new_password"
                  type="password"
                  autoComplete="new-password"
                  isRequired
                  minLength={MIN_PASSWORD_LENGTH}
                  value={newPassword}
                  onChange={setNewPassword}
                  validate={runValidator(validatePassword)}
                  description={t('cmsui.auth.resetPassword.passwordHint', {
                    min: MIN_PASSWORD_LENGTH,
                  })}
                />
                <TextField
                  label={t('cmsui.auth.resetPassword.confirmPassword')}
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  isRequired
                  validate={runValidator((value: string) =>
                    validatePasswordMatch(newPassword, value),
                  )}
                />
              </>
            )}
            <div
              className={
                hasToken
                  ? 'flex items-center justify-end'
                  : 'flex items-center justify-between'
              }
            >
              {!hasToken && <Link href="/login">{t('cmsui.auth.signIn')}</Link>}
              <Button
                variant="primary"
                accent
                size="L"
                type="submit"
                aria-label={
                  hasToken
                    ? t('cmsui.auth.resetPassword.setSubmit')
                    : t('cmsui.auth.resetPassword.requestSubmit')
                }
              >
                <ArrowRightSVG />
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </ResetPasswordLayout>
  );
}
