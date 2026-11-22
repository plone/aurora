import {
  Accordion,
  AccordionItem,
  AccordionItemTrigger,
  AccordionPanel,
  Tab,
  TabList,
  TabPanel,
  TabPanelCarousel,
  Tabs,
} from '@plone/quanta';
import { useFormContext } from '@plone/helpers';
import type { FieldSchema } from '@plone/types';
import { atom, useAtomValue } from 'jotai';
import { useMemo } from 'react';
import type { Key } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import SchemaField, { type FieldProps } from './Field';

export type FieldsetsSchema = {
  fieldsets: Array<{ id: string; title: string; fields: string[] }>;
  properties: Record<string, FieldSchema>;
  required?: string[];
};

type SchemaFieldsetsProps = {
  /** The schema whose fieldsets and fields are rendered. */
  schema: FieldsetsSchema;
  /** Extra props for a field, for example an `onChange` listener. */
  getFieldProps?: (
    fieldName: string,
  ) => Partial<Pick<FieldProps, 'onChange' | 'setValue' | 'onBlur'>>;
  /**
   * `accordion` (the default) folds each fieldset, for narrow places like the
   * sidebar. `sections` lays them out one after the other, for a full page.
   * `tabs` shows one fieldset at a time, with a tab for each: on narrow touch
   * screens the fieldsets can be swiped.
   */
  layout?: 'accordion' | 'sections' | 'tabs';
  /** With `layout="tabs"`: the id of the fieldset shown, to control it. */
  selectedKey?: Key;
  /** With `layout="tabs"`: called when another fieldset is shown. */
  onSelectionChange?: (key: Key) => void;
};

/**
 * A fieldset's tab. It shows a dot when a field of the fieldset shows an
 * error, since the field itself may be hidden in another tab.
 */
const FieldsetTab = ({
  id,
  title,
  fields,
}: {
  id: string;
  title: string;
  fields: string[];
}) => {
  const { t } = useTranslation();
  const form = useFormContext();
  const invalidAtom = useMemo(
    () =>
      atom((get) => fields.some((field) => get(form.metaAtom(field)).invalid)),
    [form, fields],
  );
  const invalid = useAtomValue(invalidAtom, { store: form.store });
  return (
    <Tab id={id}>
      {title}
      {invalid && (
        <span
          role="img"
          aria-label={t('cmsui.form.fieldsetHasErrors')}
          className="size-1.5 shrink-0 rounded-full bg-quanta-candy"
        />
      )}
    </Tab>
  );
};

/**
 * Renders a schema's fieldsets, and a widget for each of their fields.
 *
 * It must be rendered inside a `FormProvider`: each field reads and writes
 * its value in that form. Every schema-driven form (content, control panels,
 * block settings) renders its fields through this component, so they all
 * build the widget props the same way.
 */
const SchemaFieldsets = ({
  schema,
  getFieldProps,
  layout = 'accordion',
  selectedKey,
  onSelectionChange,
}: SchemaFieldsetsProps) => {
  const { t } = useTranslation();
  const renderField = (fieldName: string, className?: string) => (
    <SchemaField
      key={fieldName}
      className={className}
      name={fieldName}
      schema={schema.properties[fieldName] ?? {}}
      required={schema.required?.includes(fieldName)}
      {...getFieldProps?.(fieldName)}
    />
  );

  if (layout === 'tabs') {
    const fieldsets = schema.fieldsets.filter(
      (fieldset) => fieldset.fields.length > 0,
    );
    const renderFields = (fields: string[]) => (
      <div className="flex flex-col gap-6">
        {fields.map((fieldName) => renderField(fieldName))}
      </div>
    );
    if (fieldsets.length <= 1) return renderFields(fieldsets[0]?.fields ?? []);
    return (
      <Tabs
        selectedKey={selectedKey}
        onSelectionChange={onSelectionChange}
        defaultSelectedKey={
          selectedKey === undefined ? fieldsets[0].id : undefined
        }
      >
        <TabList aria-label={t('cmsui.form.fieldsets')}>
          {fieldsets.map((fieldset) => (
            <FieldsetTab
              key={fieldset.id}
              id={fieldset.id}
              title={fieldset.title}
              fields={fieldset.fields}
            />
          ))}
        </TabList>
        <TabPanelCarousel>
          {fieldsets.map((fieldset) => (
            <TabPanel
              key={fieldset.id}
              id={fieldset.id}
              shouldForceMount
              className="px-0.5 pt-6 pb-4"
            >
              {renderFields(fieldset.fields)}
            </TabPanel>
          ))}
        </TabPanelCarousel>
      </Tabs>
    );
  }

  if (layout === 'sections') {
    const fieldsets = schema.fieldsets.filter(
      (fieldset) => fieldset.fields.length > 0,
    );
    // A lone fieldset is the whole form: its title, often "Default", says
    // nothing.
    const showTitles = fieldsets.length > 1;
    return (
      <div className="flex flex-col">
        {fieldsets.map((fieldset) => (
          <section
            key={fieldset.id}
            aria-labelledby={showTitles ? `fieldset-${fieldset.id}` : undefined}
            className={`
              border-quanta-smoke
              not-first:mt-10 not-first:border-t not-first:pt-8
            `}
          >
            {showTitles && (
              <h2
                id={`fieldset-${fieldset.id}`}
                className="mb-5 text-lg leading-6 font-semibold text-quanta-denim"
              >
                {fieldset.title}
              </h2>
            )}
            <div className="flex flex-col gap-6">
              {fieldset.fields.map((fieldName) => renderField(fieldName))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <>
      {schema.fieldsets.map((fieldset) => (
        <Accordion defaultExpandedKeys={['default']} key={fieldset.id}>
          <AccordionItem id={fieldset.id}>
            <AccordionItemTrigger>{fieldset.title}</AccordionItemTrigger>
            <AccordionPanel>
              {fieldset.fields.map((fieldName) =>
                renderField(fieldName, 'mb-4'),
              )}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      ))}
    </>
  );
};

export default SchemaFieldsets;
