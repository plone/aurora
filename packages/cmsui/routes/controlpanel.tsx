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
import { atom, createStore, Provider } from 'jotai';
import { useRef } from 'react';
import { ploneClientContext } from '@plone/aurora/app/middleware.server';
import type { DeepKeys } from '@tanstack/react-form';
import { requireAuthCookie } from '@plone/react-router';
import { InitAtoms } from '@plone/helpers';
import type {
  Controlpanel,
  ControlPanelFieldset,
  ControlPanelSchema,
} from '@plone/types';
import { Plug } from '@plone/layout/components/Pluggable';
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionItemTrigger,
  Container,
  Link,
} from '@plone/quanta';
import { useAppForm } from '../components/Form/Form';
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
  const { controlpanel } = useLoaderData<typeof loader>();
  const params = useParams();

  // Remount the form, and with it its store, when moving between panels.
  return (
    <ControlPanelForm
      key={params.id || 'navigation'}
      controlpanel={controlpanel}
    />
  );
}

function ControlPanelForm({ controlpanel }: { controlpanel: Controlpanel }) {
  const { filterControlPanelsSchema } = config.settings;
  const schema = filterControlPanelsSchema(controlpanel);
  const { t } = useTranslation();

  const fetcher = useFetcher();
  // Each panel gets its own store: the default store would keep the values of
  // the first panel opened, since `InitAtoms` hydrates an atom only once.
  const storeRef = useRef(createStore());
  const store = storeRef.current;

  const form = useAppForm({
    defaultValues: controlpanel.data,
    onSubmit: async () => {
      // The atom is the source of truth for the form data.
      fetcher.submit(store.get(formAtom) as unknown as SubmitTarget, {
        method: 'post',
        encType: 'application/json',
      });
    },
  });

  // TODO: filter fields with filterControlPanelsSchema from config.settings
  return (
    <Provider store={store}>
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
              {schema.fieldsets.map((fieldset: ControlPanelFieldset) => (
                <Accordion defaultExpandedKeys={['default']} key={fieldset.id}>
                  <AccordionItem id={fieldset.id} key={fieldset.id}>
                    <AccordionItemTrigger>
                      {fieldset.title}
                    </AccordionItemTrigger>
                    <AccordionPanel>
                      {(fieldset.fields as DeepKeys<ControlPanelSchema>[]).map(
                        (schemaField, index) => (
                          <form.AppField
                            name={schemaField}
                            key={index}
                            // eslint-disable-next-line react/no-children-prop
                            children={(field) => (
                              <field.Quanta
                                {...schema.properties[schemaField]}
                                className="mb-4"
                                label={schema.properties[field.name].title}
                                name={field.name}
                                defaultValue={field.state.value}
                                required={
                                  schema.required.indexOf(schemaField) !== -1
                                }
                                error={field.state.meta.errors}
                                formAtom={formAtom}
                                value={field.state.value}
                              />
                            )}
                          />
                        ),
                      )}
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              ))}
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
    </Provider>
  );
}
