import {
  data,
  redirect,
  RouterContextProvider,
  useFetcher,
  useLoaderData,
  useParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type SubmitTarget,
} from 'react-router';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { requireAuthCookie } from '@plone/react-router';
import { FormProvider, useFormStore } from '@plone/helpers';
import type { Controlpanel } from '@plone/types';
import { Plug } from '@plone/layout/components/Pluggable';
import { Container, Link } from '@plone/quanta';
import SchemaFieldsets, {
  type FieldsetsSchema,
} from '../components/Form/SchemaFieldsets';
import {
  buildSchemaValidators,
  firstInvalidField,
  focusField,
  getServerValidationErrors,
} from '../components/Form/validation';
import { WidgetContextProvider } from '../components/Form/WidgetContext';
import Back from '@plone/icons/svg/arrow-left.svg?react';
import Checkbox from '@plone/icons/svg/checkbox.svg?react';
import config from '@plone/registry';

export async function loader({
  params,
  request,
  context,
}: LoaderFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const panel_id = params.id || 'navigation';

  const cli = context.get(ploneClientContext);

  const { data: controlpanel } = await cli.getControlpanel({ id: panel_id });
  return { controlpanel };
}

export async function action({
  params,
  request,
  context,
}: ActionFunctionArgs<RouterContextProvider>) {
  await requireAuthCookie(request);

  const cli = context.get(ploneClientContext);
  const panel_id = params.id || 'navigation';

  try {
    await cli.updateControlpanel({
      path: panel_id,
      data: await request.json(),
    });
  } catch (error) {
    // Validation errors go back to the form, on their fields.
    const errors = getServerValidationErrors(error);
    if (errors) return data({ errors }, { status: 400 });
    throw error;
  }

  // Saved: back to the site setup.
  return redirect('/controlpanel');
}

export default function SingleControlPanel() {
  const { controlpanel } = useLoaderData<typeof loader>();
  const params = useParams();
  const panelId = params.id || 'navigation';

  // Remount the form when moving between panels.
  return (
    <ControlPanelForm
      key={panelId}
      panelId={panelId}
      controlpanel={controlpanel}
    />
  );
}

function ControlPanelForm({
  panelId,
  controlpanel,
}: {
  panelId: string;
  controlpanel: Controlpanel;
}) {
  const { filterControlPanelsSchema } = config.settings;
  const schema = filterControlPanelsSchema(controlpanel);
  const { t } = useTranslation();

  const fetcher = useFetcher();
  const validators = useMemo(
    () => buildSchemaValidators(schema as FieldsetsSchema, { t }),
    [schema, t],
  );

  // Each panel gets a form store of its own.
  const form = useFormStore({
    key: panelId,
    initialValues: controlpanel.data,
    validators,
    onSubmit: (values) => {
      fetcher.submit(values as unknown as SubmitTarget, {
        method: 'post',
        encType: 'application/json',
      });
    },
  });

  const showErrors = useCallback(
    (errors: Record<string, unknown>) => {
      const field = firstInvalidField(schema as FieldsetsSchema, errors);
      if (field) focusField(field);
    },
    [schema],
  );

  // The save action returns the server's validation errors, by field.
  useEffect(() => {
    const errors = (fetcher.data as { errors?: Record<string, string[]> })
      ?.errors;
    if (!errors) return;
    form.setServerErrors(errors);
    showErrors(errors);
  }, [fetcher.data, form, showErrors]);

  const description = t(`cmsui.controlpanelDescriptions.${panelId}`, {
    defaultValue: '',
  });

  return (
    <FormProvider form={form}>
      <WidgetContextProvider mode="settings" path="/">
        <main>
          <Container
            width="default"
            className={`
              route-controlpanel px-4 pt-6 pb-16
              md:px-12 md:pt-12
            `}
          >
            <header className="mb-8 flex flex-col gap-1">
              <Link
                href="/controlpanel"
                className={`
                  self-start text-[13px] font-medium text-quanta-sapphire no-underline
                  hover:text-quanta-royal
                `}
              >
                {t('cmsui.siteSetup')}
              </Link>
              <h1
                className={`
                  documentFirstHeading text-[28px] leading-[34px] font-bold text-quanta-denim
                `}
              >
                {controlpanel.title || 'a control panel'}
              </h1>
              {description && (
                <p className="text-sm text-quanta-iron">{description}</p>
              )}
            </header>
            <form>
              <SchemaFieldsets
                schema={schema as FieldsetsSchema}
                layout="sections"
              />
              <Plug pluggable="toolbar-top" id="edit-save-button">
                {/* A native button: react-aria's onPress does not fire inside
                  the toolbar's shadow root. */}
                <button
                  aria-label={t('cmsui.save')}
                  type="submit"
                  onClick={async () => {
                    const result = await form.submit();
                    if (!result.ok) showErrors(result.errors);
                  }}
                  className="primary"
                >
                  <Checkbox />
                </button>
              </Plug>
            </form>
          </Container>
        </main>
        {/* The toolbar shows its plugs in render order: save first, as in
          the edit form, then back. */}
        <Plug pluggable="toolbar-top" id="button-back">
          <Link aria-label="back" href="/controlpanel">
            <Back />
          </Link>
        </Plug>
      </WidgetContextProvider>
    </FormProvider>
  );
}
