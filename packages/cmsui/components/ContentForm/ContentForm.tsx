import Checkbox from '@plone/icons/svg/checkbox.svg?react';
import Close from '@plone/icons/svg/close.svg?react';
import Settings from '@plone/icons/svg/settings.svg?react';
import { Link, Tab, TabList, TabPanel, Tabs } from '@plone/quanta';
import { FormProvider, useFormStore } from '@plone/helpers';
import { Plug } from '@plone/layout/components/Pluggable';
import config from '@plone/registry';
import type { Content } from '@plone/types';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import { useFetcher, type SubmitTarget } from 'react-router';
import SchemaFieldsets, { type FieldsetsSchema } from '../Form/SchemaFieldsets';
import {
  buildSchemaValidators,
  firstInvalidField,
  focusField,
} from '../Form/validation';
import { WidgetContextProvider } from '../Form/WidgetContext';
import Sidebar, { sidebarAtom } from '../Sidebar/Sidebar';
import BlocksEditor from '../BlockEditor/BlocksEditor';

interface Schema extends FieldsetsSchema {
  title: string;
}

interface ContentFormProps {
  content: Content;
  /**
   * The path the form is about: the edited object, or the container a new
   * object is added to. Widgets such as the object browser start from it.
   */
  path: string;
  schema: Schema;
  heading: ReactNode;
  submitMethod: 'post' | 'patch';
  /** Per-tab sticky panels rendered left of the form (eg. translation source). */
  asidePanels?: { header?: ReactNode; blocks?: ReactNode; content?: ReactNode };
  /** Placeholder text per field name (eg. the source values of a translation). */
  fieldPlaceholders?: Record<string, string>;
  /** Where Cancel goes, when not the content itself (eg. a translation's source). */
  cancelHref?: string;
}

export default function ContentForm({
  content,
  path,
  schema,
  heading,
  submitMethod,
  asidePanels,
  fieldPlaceholders,
  cancelHref,
}: ContentFormProps) {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const [collapsed, setCollapsed] = useAtom(sidebarAtom);
  const [selectedTab, setSelectedTab] = useState<Key>('blocks');
  const validators = useMemo(
    () => buildSchemaValidators<Content>(schema, { t }),
    [schema, t],
  );

  // The form's values are the single source of truth for the content being
  // edited: the fields, the blocks editor and Plate's title binding all read
  // and write them through the form.
  const form = useFormStore<Content>({
    key: content['@id'] ?? 'add',
    initialValues: content,
    validators,
    onSubmit: (values) => {
      fetcher.submit(values as unknown as SubmitTarget, {
        method: submitMethod,
        encType: 'application/json',
      });
    },
  });

  // Shows the fields with errors: they are in the Content tab.
  const showErrors = useCallback(
    (errors: Record<string, unknown>) => {
      const field = firstInvalidField(schema, errors);
      if (!field) return;
      setSelectedTab('content');
      focusField(field);
    },
    [schema],
  );

  // The save action returns the server's validation errors, by field, or an
  // `error` message that belongs to no field (eg. a conflict).
  useEffect(() => {
    const { errors, error } = (fetcher.data ?? {}) as {
      errors?: Record<string, string[]>;
      error?: string;
    };
    if (error) {
      config.getUtility({ name: 'show', type: 'toast' }).method({
        title: t('cmsui.saveFailed'),
        description: error,
        className: 'error',
      });
    }
    if (!errors) return;
    form.setServerErrors(errors);
    showErrors(errors);
  }, [fetcher.data, form, showErrors, t]);

  // Non-reserved schema keys reach the widget, so a placeholder set on the
  // field's schema property is rendered by any widget that supports it.
  const fieldsSchema = useMemo(
    () =>
      fieldPlaceholders
        ? {
            ...schema,
            properties: Object.fromEntries(
              Object.entries(schema.properties).map(([name, property]) => [
                name,
                fieldPlaceholders[name]
                  ? { ...property, placeholder: fieldPlaceholders[name] }
                  : property,
              ]),
            ),
          }
        : schema,
    [schema, fieldPlaceholders],
  );

  const fieldsetsForm = (
    <form>
      <SchemaFieldsets schema={fieldsSchema} />
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
    <FormProvider form={form}>
      <WidgetContextProvider
        mode={submitMethod === 'post' ? 'add' : 'edit'}
        path={path}
      >
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
            <Tabs selectedKey={selectedTab} onSelectionChange={setSelectedTab}>
              <TabList>
                <Tab id="blocks">{t('cmsui.blocksEditor.blocksTab')}</Tab>
                <Tab id="content">{t('cmsui.blocksEditor.contentTab')}</Tab>
              </TabList>
              <TabPanel id="blocks" className="p-3">
                {withAside(asidePanels?.blocks, <BlocksEditor />)}
              </TabPanel>
              <TabPanel id="content" className="p-3">
                {withAside(
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
                )}
              </TabPanel>
            </Tabs>
            <Plug pluggable="toolbar-top" id="edit-save-button">
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
            <Plug
              pluggable="toolbar-top"
              id="button-cancel"
              dependencies={[cancelHref ?? content['@id']] as any}
            >
              <Link
                aria-label={t('cmsui.cancel')}
                href={cancelHref ?? content['@id']}
              >
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
      </WidgetContextProvider>
    </FormProvider>
  );
}
