import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import config from '@plone/registry';
import { FormProvider, useFormStore, type FormApi } from '@plone/helpers';
import installWidgets from '../../config/widgets';
import { buildSchemaValidators } from '../Form/validation';
import { ObjectListWidget, type CellRenderer } from './ObjectListWidget';
import type { ItemSchema, ObjectListItem } from './objectList';

// The item fields resolve their widgets from the registry, as in the app.
installWidgets(config);

const actionSchema: ItemSchema = {
  title: 'Action',
  addMessage: 'Add action',
  fieldsets: [
    { id: 'default', title: 'Default', fields: ['title', 'href', 'newTab'] },
  ],
  properties: {
    title: { title: 'Title' },
    href: { title: 'Target', description: 'A path of the site, or a URL.' },
    newTab: { title: 'Open in a new tab', type: 'boolean', default: false },
  },
  required: ['title'],
};

const actions: ObjectListItem[] = [
  { '@id': 'a1', title: 'Sitemap', href: '/sitemap', newTab: false },
  { '@id': 'a2', title: 'Accessibility', href: '/accessibility-info' },
  { '@id': 'a3', title: 'Contact', href: '/contact' },
];

const NETWORKS: Record<
  string,
  { title: string; color: string; short: string }
> = {
  mastodon: { title: 'Mastodon', color: '#6364ff', short: 'M' },
  linkedin: { title: 'LinkedIn', color: '#0a66c2', short: 'in' },
  github: { title: 'GitHub', color: '#24292f', short: 'GH' },
  youtube: { title: 'YouTube', color: '#ff0033', short: '▶' },
};

const socialLinkSchema: ItemSchema = {
  title: 'Link',
  fieldsets: [
    { id: 'default', title: 'Default', fields: ['id', 'title', 'href'] },
  ],
  properties: {
    id: {
      title: 'Network',
      choices: Object.entries(NETWORKS).map(([token, network]) => [
        token,
        network.title,
      ]),
    },
    title: { title: 'Title' },
    href: { title: 'Link', widget: 'url' },
  },
  required: ['id', 'href'],
};

const socialLinks: ObjectListItem[] = [
  {
    '@id': 's1',
    id: 'mastodon',
    title: 'Plone on Mastodon',
    href: 'https://fosstodon.org/@plone',
  },
  {
    '@id': 's2',
    id: 'linkedin',
    title: 'Plone Foundation',
    href: 'https://www.linkedin.com/company/plone-foundation',
  },
  {
    '@id': 's3',
    id: 'github',
    title: 'GitHub',
    href: 'https://github.com/plone',
  },
];

/** A network, by its icon and its name. */
const NetworkCell: CellRenderer = (value) => {
  const network = typeof value === 'string' ? NETWORKS[value] : undefined;
  if (!network) return typeof value === 'string' ? value : '';
  return (
    <span className="inline-flex items-center gap-2 font-semibold">
      <span
        aria-hidden
        className={`
          flex size-6 items-center justify-center rounded-md text-[10px] font-bold text-white
        `}
        style={{ background: network.color }}
      >
        {network.short}
      </span>
      {network.title}
    </span>
  );
};

/** The field's value, as the form stores it. */
function StoredValue({ form, name }: { form: FormApi<any>; name: string }) {
  const value = useAtomValue(form.fieldAtom(name), { store: form.store });
  return (
    <details className="mt-6 text-xs">
      <summary className="cursor-pointer text-quanta-pigeon">
        Stored value
      </summary>
      <pre className="mt-2 overflow-auto rounded-md bg-quanta-snow p-3">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

type StoryArgs = React.ComponentProps<typeof ObjectListWidget> & {
  /** The width the widget is shown at, such as the sidebar's. */
  width?: string;
  /** Validates the items with the item schema, and shows a Save button. */
  validated?: boolean;
};

/**
 * The widget as a field of a form: its item fields are fields of the same
 * form, at `<name>.<index>.<field>`.
 */
function InForm({ width, validated, ...args }: StoryArgs) {
  const { t } = useTranslation();
  const form = useFormStore<Record<string, unknown>>({
    key: args.name,
    initialValues: { [args.name]: args.value },
    validators: validated
      ? buildSchemaValidators(
          {
            properties: {
              [args.name]: {
                title: String(args.label),
                widget: 'object_list',
                schema: args.schema as never,
              },
            },
          },
          { t },
        )
      : undefined,
  });
  return (
    <FormProvider form={form}>
      <div style={{ maxWidth: width }}>
        <Field {...args} form={form} />
        {validated && (
          <button
            type="button"
            onClick={() => void form.submit()}
            className={`
              mt-4 rounded-md bg-quanta-sapphire px-4 py-2 text-sm font-semibold text-white
            `}
          >
            Save
          </button>
        )}
        <StoredValue form={form} name={args.name} />
      </div>
    </FormProvider>
  );
}

function Field({
  form,
  ...args
}: StoryArgs & { form: FormApi<Record<string, unknown>> }): ReactNode {
  const value = useAtomValue(form.fieldAtom(args.name), { store: form.store });
  return (
    <ObjectListWidget
      {...args}
      value={value as ObjectListItem[]}
      onChange={(next) => form.setFieldValue(args.name, next)}
    />
  );
}

const meta: Meta<StoryArgs> = {
  title: 'CMSUI/Widgets/ObjectListWidget',
  component: ObjectListWidget,
  args: {
    name: 'site_actions',
    label: 'Site actions',
    description: 'Links shown in the top bar.',
    value: actions,
    schema: actionSchema as never,
    onChange: () => {},
  },
  render: (args) => <InForm {...args} />,
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Each item opens to edit its fields in place. */
export const Accordion: Story = {};

/** At the width of the block settings sidebar. */
export const AccordionInSidebar: Story = {
  args: { width: '22rem' },
};

/** No items yet: the empty state adds the first one. */
export const Empty: Story = {
  args: { value: [] },
};

/** The list is full: Add and Duplicate are disabled. */
export const MaxItems: Story = {
  args: { maxItems: 3 },
};

/** The form's validation error for the whole list. */
export const Invalid: Story = {
  args: {
    required: true,
    invalid: true,
    errorMessage: 'The number of items must be greater than or equal to 4.',
  },
};

/**
 * The form validates the items with the item schema. Save opens the first
 * item with errors, and marks the rows of the items with errors.
 */
export const Validation: Story = {
  args: {
    validated: true,
    value: [
      { '@id': 'a1', title: 'Sitemap', href: '/sitemap' },
      { '@id': 'a2', title: '', href: '/accessibility-info' },
      { '@id': 'a3', title: '', href: '/contact' },
    ],
  },
};

/**
 * Each item is a row of the columns asked for, and opens in a dialog: a
 * bottom sheet on phones. The network column renders with a cell renderer.
 */
export const Table: Story = {
  args: {
    name: 'social_links',
    label: 'Social links',
    description: 'Shown in the footer, in this order.',
    value: socialLinks,
    schema: socialLinkSchema as never,
    layout: 'table',
    columns: ['id', 'title', 'href'],
    cells: { id: NetworkCell },
  },
};

/** Where the table has no room, its items become a list of rows. */
export const TableInSidebar: Story = {
  args: {
    ...Table.args,
    width: '22rem',
  },
};
