import { useEffect, useRef } from 'react';
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  type MetaFunction,
  RouterContextProvider,
  useActionData,
  useLoaderData,
  useLocation,
} from 'react-router';
import {
  ploneClientContext,
  ploneContentContext,
  ploneSiteContext,
} from '@plone/aurora/app/middleware.server';
import { redirectIfLoggedInLoader } from '@plone/react-router';
import { Button, Link, TextField } from '@plone/components/quanta';
import CloseSVG from '@plone/components/icons/close.svg?react';
import ArrowRightSVG from '@plone/components/icons/arrow-right.svg?react';
import SlotRenderer from '@plone/layout/slots/SlotRenderer';
import { useTranslation } from 'react-i18next';
import type { RootLoader } from '@plone/aurora/app/root';

export async function loader(props: LoaderFunctionArgs<RouterContextProvider>) {
  const { context } = props;
  await redirectIfLoggedInLoader(props);

  const content = context.get(ploneContentContext);
  const site = context.get(ploneSiteContext);
  return { content, siteTitle: site['plone.site_title'] };
}

export const meta: MetaFunction<unknown, { root: RootLoader }> = ({
  matches,
}) => {
  const rootData = matches.find((match) => match.id === 'root')?.data;
  const siteTitle = rootData?.site?.['plone.site_title'];
  return [{ title: siteTitle || 'Register' }];
};

type RegisterSuccessResponse = { ok: true };

type RegisterErrorResponse = {
  status: number;
  data: {
    error: {
      message: string;
    };
  };
};

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  const formData = await request.formData();
  const fullname = String(formData.get('fullname') || '');
  const email = String(formData.get('email') || '');

  const cli = context.get(ploneClientContext);

  try {
    await cli.createUser({
      data: { fullname, email, username: email, sendPasswordReset: true },
    });
    return { ok: true } satisfies RegisterSuccessResponse;
  } catch (error: any) {
    return {
      status: Number(error?.status) || 500,
      data: {
        error: {
          message: error?.data?.error?.message || 'Registration failed',
        },
      },
    } satisfies RegisterErrorResponse;
  }
}

export default function Register() {
  const { content } = useLoaderData<typeof loader>();
  const actionResult = useActionData<typeof action>() as
    | RegisterSuccessResponse
    | RegisterErrorResponse
    | undefined;
  const location = useLocation();
  const { t } = useTranslation();

  const succeeded = actionResult != null && 'ok' in actionResult;
  const formError =
    actionResult && 'status' in actionResult && actionResult.status < 500
      ? actionResult.data.error.message
      : undefined;

  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (succeeded) successHeadingRef.current?.focus();
  }, [succeeded]);

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
          <div
            className={`
              flex flex-col items-center
              sm:mx-auto sm:w-full sm:max-w-md
            `}
          >
            <SlotRenderer
              name="loginLogo"
              content={content}
              location={location}
            />
            <h2
              ref={successHeadingRef}
              tabIndex={-1}
              id="register-header"
              className="mt-6 text-center text-2xl leading-8 font-bold tracking-wide text-gray-900"
            >
              {succeeded
                ? t('cmsui.auth.register.successTitle')
                : t('cmsui.auth.register.title')}
            </h2>
            {succeeded && (
              <p className="mt-3 text-center text-sm text-quanta-iron">
                {t('cmsui.auth.register.successBody')}
              </p>
            )}
          </div>
          {succeeded ? (
            <div className="mt-6">
              <Link href="/login">{t('cmsui.auth.signIn')}</Link>
            </div>
          ) : (
            <div className="mx-auto mt-11 w-full max-w-[360px]">
              <div className="bg-quanta-air">
                <Form
                  className="space-y-6"
                  method="post"
                  aria-labelledby="register-header"
                >
                  <TextField
                    label={t('cmsui.auth.register.fullname')}
                    name="fullname"
                    autoComplete="name"
                    isRequired
                    description={t('cmsui.auth.register.fullnameHint')}
                  />
                  <TextField
                    label={t('cmsui.auth.register.email')}
                    name="email"
                    type="email"
                    autoComplete="email"
                    isRequired
                    description={t('cmsui.auth.register.emailHint')}
                    isInvalid={formError ? true : undefined}
                    errorMessage={formError}
                  />
                  <div className="flex items-center justify-between">
                    <Link href="/login">{t('cmsui.auth.signIn')}</Link>
                    <Button
                      variant="primary"
                      accent
                      size="L"
                      type="submit"
                      aria-label={t('cmsui.auth.register.submit')}
                    >
                      <ArrowRightSVG />
                    </Button>
                  </div>
                </Form>
              </div>
            </div>
          )}
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
