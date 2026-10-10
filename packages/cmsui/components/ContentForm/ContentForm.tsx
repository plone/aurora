import Checkbox from '@plone/icons/svg/checkbox.svg?react';
import Close from '@plone/icons/svg/close.svg?react';
import Settings from '@plone/icons/svg/settings.svg?react';
import { Tabs, Link } from '@plone/quanta';
import { FormProvider, useFormStore } from '@plone/helpers';
import { Plug } from '@plone/layout/components/Pluggable';
import type { Content } from '@plone/types';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetcher, type SubmitTarget } from 'react-router';
import SchemaFieldsets, { type FieldsetsSchema } from '../Form/SchemaFieldsets';
import Sidebar, { sidebarAtom } from '../Sidebar/Sidebar';
import BlocksEditor from '../BlockEditor/BlocksEditor';

interface Schema extends FieldsetsSchema {
  title: string;
}

interface ContentFormProps {
  content: Content;
  schema: Schema;
  heading: ReactNode;
  submitMethod: 'post' | 'patch';
}

export default function ContentForm({
  content,
  schema,
  heading,
  submitMethod,
}: ContentFormProps) {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const [collapsed, setCollapsed] = useAtom(sidebarAtom);

  // The form's values are the single source of truth for the content being
  // edited: the fields, the blocks editor and Plate's title binding all read
  // and write them through the form.
  const form = useFormStore<Content>({
    key: content['@id'] ?? 'add',
    initialValues: content,
    onSubmit: (values) => {
      fetcher.submit(values as unknown as SubmitTarget, {
        method: submitMethod,
        encType: 'application/json',
      });
    },
  });

  return (
    <FormProvider form={form}>
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
                content: <BlocksEditor />,
              },
              {
                id: 'content',
                title: t('cmsui.blocksEditor.contentTab'),
                content: (
                  <div className="flex flex-col">
                    <h1 className="mb-4 text-2xl font-bold">{heading}</h1>
                    <form>
                      <SchemaFieldsets schema={schema} />
                    </form>
                  </div>
                ),
              },
            ]}
          />
          <Plug pluggable="toolbar-top" id="edit-save-button">
            <button
              aria-label={t('cmsui.save')}
              type="submit"
              onClick={() => form.submit()}
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
    </FormProvider>
  );
}
