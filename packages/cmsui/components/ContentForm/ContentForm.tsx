import Checkbox from '@plone/components/icons/checkbox.svg?react';
import Close from '@plone/components/icons/close.svg?react';
import Settings from '@plone/components/icons/settings.svg?react';
import {
  Accordion,
  AccordionItem,
  AccordionItemTrigger,
  AccordionPanel,
  Tabs,
  Link,
} from '@plone/components/quanta';
import { InitAtoms } from '@plone/helpers';
import { Plug } from '@plone/layout/components/Pluggable';
import type { Content } from '@plone/types';
import type { DeepKeys } from '@tanstack/react-form';
import clsx from 'clsx';
import { createStore, Provider, useAtom } from 'jotai';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetcher, type SubmitTarget } from 'react-router';
import { useAppForm } from '../Form/Form';
import Sidebar, { sidebarAtom } from '../Sidebar/Sidebar';
import { formAtom } from '../../routes/atoms';
import BlocksEditor from '../BlockEditor/BlocksEditor';

interface Schema {
  title: string;
  fieldsets: Array<{
    id: string;
    title: string;
    fields: string[];
  }>;
  properties: Record<string, { title: string; [key: string]: unknown }>;
  required: string[];
}

interface ContentFormProps {
  content: Content;
  schema: Schema;
  heading: ReactNode;
  submitMethod: 'post' | 'patch';
  /** Per-tab sticky panels rendered left of the form (eg. translation source). */
  asidePanels?: { header?: ReactNode; blocks?: ReactNode; content?: ReactNode };
  /** Placeholder text per field name (eg. the source values of a translation). */
  fieldPlaceholders?: Record<string, string>;
}

export default function ContentForm({
  content,
  schema,
  heading,
  submitMethod,
  asidePanels,
  fieldPlaceholders,
}: ContentFormProps) {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const storeRef = useRef(createStore());
  const store = storeRef.current;
  const [collapsed, setCollapsed] = useAtom(sidebarAtom);

  const form = useAppForm({
    defaultValues: content,
    onSubmit: async () => {
      fetcher.submit(store.get(formAtom) as unknown as SubmitTarget, {
        method: submitMethod,
        encType: 'application/json',
      });
    },
  });

  const fieldsetsForm = (
    <form>
      {schema.fieldsets.map((fieldset) => (
        <Accordion defaultExpandedKeys={['default']} key={fieldset.id}>
          <AccordionItem id={fieldset.id} key={fieldset.id}>
            <AccordionItemTrigger>{fieldset.title}</AccordionItemTrigger>
            <AccordionPanel>
              {(fieldset.fields as DeepKeys<Content>[]).map(
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
                        required={schema.required.indexOf(schemaField) !== -1}
                        error={field.state.meta.errors}
                        formAtom={formAtom}
                        value={field.state.value}
                        {...(fieldPlaceholders?.[field.name]
                          ? { placeholder: fieldPlaceholders[field.name] }
                          : {})}
                      />
                    )}
                  />
                ),
              )}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      ))}
    </form>
  );

  // The shared header row keeps both columns starting level; px-6 mirrors the
  // blocks editor's own gutters, padBody pads bodies that lack them.
  const withAside = (panel: ReactNode, body: ReactNode, padBody = false) =>
    asidePanels ? (
      <div
        className={`
          grid grid-cols-1 gap-x-8 pt-4
          lg:grid-cols-2 lg:grid-rows-[auto_1fr]
        `}
      >
        <div className="mb-4 self-end px-6">{asidePanels.header}</div>
        <h1 className="mb-4 self-end px-6 text-2xl font-bold">{heading}</h1>
        <aside className="sticky top-0 max-h-screen self-start overflow-y-auto px-6">
          {panel}
        </aside>
        <div className={padBody ? 'flex flex-col px-6' : 'flex flex-col'}>
          {body}
        </div>
      </div>
    ) : (
      body
    );

  return (
    <Provider store={store}>
      <InitAtoms atomValues={[[formAtom, content]]}>
        <div
          id="main"
          className={clsx(
            `
              grid grid-rows-[minmax(100vh,auto)] transition-[grid-template-columns] duration-200
              ease-linear
            `,
            {
              'grid-cols-[1fr_300px]': !collapsed,
              'grid-cols-[1fr_0px]': collapsed,
            },
          )}
        >
          <main className="mx-4 pt-8">
            <Tabs
              tabs={[
                {
                  id: 'blocks',
                  title: t('cmsui.blocksEditor.blocksTab'),
                  content: withAside(asidePanels?.blocks, <BlocksEditor />),
                },
                {
                  id: 'content',
                  title: t('cmsui.blocksEditor.contentTab'),
                  content: withAside(
                    asidePanels?.content,
                    asidePanels ? (
                      fieldsetsForm
                    ) : (
                      <div className="flex flex-col">
                        <h1 className="mb-4 text-2xl font-bold">{heading}</h1>
                        {fieldsetsForm}
                      </div>
                    ),
                    true,
                  ),
                },
              ]}
            />
            <Plug pluggable="toolbar-top" id="edit-save-button">
              <button
                aria-label={t('cmsui.save')}
                type="submit"
                onClick={() => form.handleSubmit()}
                className="primary"
              >
                <Checkbox />
              </button>
            </Plug>
            <Plug
              pluggable="toolbar-top"
              id="button-cancel"
              dependencies={[content['@id']] as any}
            >
              <Link aria-label={t('cmsui.cancel')} href={content['@id']}>
                <Close />
              </Link>
            </Plug>
            <Plug pluggable="toolbar-bottom" id="button-settings">
              <button
                aria-label={t('cmsui.toolbar.settings')}
                onClick={() => setCollapsed((state) => !state)}
              >
                <Settings />
              </button>
            </Plug>
          </main>
          <Sidebar />
        </div>
      </InitAtoms>
    </Provider>
  );
}
