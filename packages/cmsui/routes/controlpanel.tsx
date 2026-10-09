import {
  redirect,
  RouterContextProvider,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { useTranslation } from 'react-i18next';
import { atom } from 'jotai';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import { requireAuthCookie } from '@plone/react-router';
import { InitAtoms } from '@plone/helpers';
import type { Controlpanel } from '@plone/types';
import { Plug } from '@plone/layout/components/Pluggable';
import { Container, Link } from '@plone/quanta';
import { useAppForm } from '../components/Form/Form';
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

const formAtom = atom<Controlpanel>({} as Controlpanel);

export default function SingleControlPanel() {
  const loaderData = useLoaderData<typeof loader>();
  const controlpanel = loaderData.controlpanel;
  const { filterControlPanelsSchema } = config.settings;
  const schema = filterControlPanelsSchema(controlpanel);
  const { t } = useTranslation();

  const fetcher = useFetcher();

  const form = useAppForm({
    defaultValues: controlpanel.data,
    onSubmit: async ({ value }) => {
      fetcher.submit(value, {
        method: 'post',
        encType: 'application/json',
      });
    },
  });

  // TODO: filter fields with filterControlPanelsSchema from config.settings
  return (
    <InitAtoms atomValues={[[formAtom, controlpanel.data]]}>
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
            <SchemaFieldsets
              schema={schema as FieldsetsSchema}
              form={form}
              formAtom={formAtom}
            />
            <Plug pluggable="toolbar-top" id="edit-save-button">
              {/* A native button: react-aria's onPress does not fire inside
                  the toolbar's shadow root. */}
              <button
                aria-label={t('cmsui.save')}
                type="submit"
                onClick={() => form.handleSubmit()}
                className="primary"
              >
                <Checkbox />
              </button>
            </Plug>
          </form>
        </Container>
      </main>
    </InitAtoms>
  );
}
