import {
  redirect,
  RouterContextProvider,
  useFetcher,
  useLoaderData,
  useParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type SubmitTarget,
} from 'react-router';
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

  await cli.updateControlpanel({
    path: panel_id,
    data: await request.json(),
  });

  return redirect(`/controlpanel/${panel_id}`);
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
  // Each panel gets a form store of its own.
  const form = useFormStore({
    key: panelId,
    initialValues: controlpanel.data,
    onSubmit: (values) => {
      fetcher.submit(values as unknown as SubmitTarget, {
        method: 'post',
        encType: 'application/json',
      });
    },
  });

  // TODO: filter fields with filterControlPanelsSchema from config.settings
  return (
    <FormProvider form={form}>
      <Plug pluggable="toolbar-top" id="button-back">
        <Link aria-label="back" href="/controlpanel">
          <Back />
        </Link>
      </Plug>
      <main>
        <Container width="default" className="route-controlpanel">
          <h1 className="documentFirstHeading">
            {controlpanel.title || 'a control panel'}
          </h1>
          <form>
            <SchemaFieldsets schema={schema as FieldsetsSchema} />
            <Plug pluggable="toolbar-top" id="edit-save-button">
              {/* A native button: react-aria's onPress does not fire inside
                  the toolbar's shadow root. */}
              <button
                aria-label={t('cmsui.save')}
                type="submit"
                onClick={() => form.submit()}
                className="primary"
              >
                <Checkbox />
              </button>
            </Plug>
          </form>
        </Container>
      </main>
    </FormProvider>
  );
}
