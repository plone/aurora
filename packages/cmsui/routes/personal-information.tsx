import {
  data,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type SubmitTarget,
  RouterContextProvider,
} from 'react-router';
import { requireAuthCookie } from '@plone/react-router';
import {
  ploneClientContext,
  ploneUserContext,
} from '@plone/aurora/app/middleware.server';
import { FormProvider, useFormStore } from '@plone/helpers';
import { Container, Link } from '@plone/quanta';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import SchemaFieldsets, {
  type FieldsetsSchema,
} from '../components/Form/SchemaFieldsets';
import { WidgetContextProvider } from '../components/Form/WidgetContext';
import {
  buildSchemaValidators,
  getServerValidationErrors,
} from '../components/Form/validation';

export async function loader({
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const user = context.get(ploneUserContext);
  if (!user) throw data('User not found', { status: 401 });
  const { data: schema } = await context
    .get(ploneClientContext)
    .getUserschema();
  const values = Object.fromEntries(
    Object.keys(schema.properties).map((key) => [
      key,
      key === 'portrait'
        ? null
        : ((user as unknown as Record<string, unknown>)[key] ?? ''),
    ]),
  );
  return { schema, values };
}

export async function action({
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);
  const user = context.get(ploneUserContext);
  if (!user) throw data('User not found', { status: 401 });
  const cli = context.get(ploneClientContext);
  const { data: schema } = await cli.getUserschema();
  const values = (await request.json()) as Record<string, unknown>;
  const allowed = Object.keys(schema.properties).filter(
    (key) => !['id', 'username', 'roles'].includes(key),
  );
  const changes = Object.fromEntries(
    allowed
      .filter((key) => key in values && !(key === 'portrait' && !values[key]))
      .map((key) => [key, values[key]]),
  );
  try {
    await cli.updateUser({ id: user.id, data: changes });
  } catch (error) {
    const errors = getServerValidationErrors(error);
    if (errors) return data({ errors }, { status: 400 });
    throw error;
  }
  return { saved: true };
}

export default function PersonalInformation() {
  const { schema: rawSchema, values } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const fetcher = useFetcher<typeof action>();
  const schema = rawSchema as unknown as FieldsetsSchema;
  const validators = useMemo(
    () => buildSchemaValidators(schema, { t }),
    [schema, t],
  );
  const form = useFormStore({
    key: 'personal-information',
    initialValues: values,
    validators,
    onSubmit: (data) =>
      fetcher.submit(data as unknown as SubmitTarget, {
        method: 'post',
        encType: 'application/json',
      }),
  });
  useEffect(() => {
    if (fetcher.data && 'errors' in fetcher.data && fetcher.data.errors)
      form.setServerErrors(fetcher.data.errors);
  }, [fetcher.data, form]);
  return (
    <main>
      <Container width="default">
        <h1>
          {t('cmsui.personalInformation.title', {
            defaultValue: 'Personal information',
          })}
        </h1>
        <FormProvider form={form}>
          <WidgetContextProvider mode="settings" path="/">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void form.submit();
              }}
            >
              <SchemaFieldsets schema={schema} />
              {fetcher.data && 'saved' in fetcher.data && (
                <p role="status">
                  {t('cmsui.personalInformation.saved', {
                    defaultValue: 'Changes saved',
                  })}
                </p>
              )}
              <button type="submit" disabled={fetcher.state !== 'idle'}>
                {t('cmsui.save')}
              </button>{' '}
              <Link href="/">{t('cmsui.cancel')}</Link>
            </form>
          </WidgetContextProvider>
        </FormProvider>
      </Container>
    </main>
  );
}
