import {
  RouterContextProvider,
  useFetcher,
  useLoaderData,
  useNavigate,
  type ActionFunctionArgs,
  type FetcherWithComponents,
  type LoaderFunctionArgs,
} from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import {
  ploneClientContext,
  ploneUserContext,
} from '@plone/aurora/app/middleware.server';
import { Button, Container, Link } from '@plone/components/quanta';
import { useTranslation } from 'react-i18next';
import { useAppForm } from '../components/Form/Form';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const user = context.get(ploneUserContext);
  const cli = context.get(ploneClientContext);
  const { data: userschema } = await cli.getUserschema();
  return { user, userschema };
}

type ActionResult = { ok: true } | { ok: false; error: string };

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>): Promise<ActionResult> {
  await requireAuthCookie(request);

  const data = await request.json();
  const cli = context.get(ploneClientContext);
  const user = context.get(ploneUserContext);

  if (!user?.id) {
    return { ok: false, error: 'No authenticated user' };
  }

  try {
    await cli.updateUser({ id: user.id, data });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return { ok: true };
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function PersonalInformation() {
  const { user, userschema } = useLoaderData<typeof loader>();
  // fetcher: successful save remounts the form (fresh key), feedback survives
  const fetcher = useFetcher<typeof action>();
  const { t } = useTranslation();
  return (
    <main>
      <Container
        width="default"
        className="route-controlpanel route-personal-information"
      >
        {/* key: remount to reload persisted values */}
        <PersonalInformationForm
          key={JSON.stringify(user)}
          user={user}
          userschema={userschema}
          fetcher={fetcher}
        />
        {fetcher.data?.ok === false ? (
          <p
            role="alert"
            title={fetcher.data.error}
            className="mt-4 text-destructive"
          >
            {t('cmsui.saveError')}
          </p>
        ) : null}
        {/* live region, changes get announced here */}
        <p role="status" aria-live="polite" className="sr-only">
          {fetcher.data?.ok === true ? t('cmsui.saveSuccess') : ''}
        </p>
      </Container>
    </main>
  );
}

function PersonalInformationForm({
  user,
  userschema,
  fetcher,
}: {
  user: LoaderData['user'];
  userschema: LoaderData['userschema'];
  fetcher: FetcherWithComponents<ActionResult>;
}) {
  const properties = userschema.properties as Record<string, any>;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const form = useAppForm({
    defaultValues: (user ?? {}) as Record<string, unknown>,
    onSubmit: async ({ value }) => {
      // skip `portrait`
      const data: Record<string, string> = {};
      userschema.fieldsets.forEach((fieldset) =>
        fieldset.fields.forEach((field) => {
          if (field === 'portrait') return;
          const v = (value as Record<string, unknown>)[field];
          if (typeof v === 'string' && v !== '') data[field] = v;
        }),
      );
      fetcher.submit(data, { method: 'post', encType: 'application/json' });
    },
  });

  return (
    <>
      <h1 className="documentFirstHeading">{t('cmsui.personalInformation')}</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
      >
        {userschema.fieldsets.map((fieldset) => (
          <div key={fieldset.id}>
            {fieldset.fields.map((schemaField, index) => (
              <form.AppField
                name={schemaField}
                key={index}
                // eslint-disable-next-line react/no-children-prop
                children={(field) => (
                  <field.Quanta
                    {...properties[schemaField]}
                    className="mb-4"
                    label={properties[schemaField].title}
                    name={field.name}
                    defaultValue={field.state.value}
                    required={userschema.required.includes(schemaField)}
                    error={field.state.meta.errors}
                  />
                )}
              />
            ))}
          </div>
        ))}
        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            accent
            isDisabled={fetcher.state !== 'idle'}
            onPress={() => form.handleSubmit()}
          >
            {t('cmsui.save')}
          </Button>
          <Button onPress={() => navigate('/')}>{t('cmsui.cancel')}</Button>
        </div>
      </form>
      {/* route from PR #109 */}
      <Link href="/reset-password" className="mt-4 inline-block">
        {t('cmsui.changePassword')}
      </Link>
    </>
  );
}
