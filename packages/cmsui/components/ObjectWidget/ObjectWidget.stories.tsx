import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import config from '@plone/registry';
import installWidgets from '../../config/widgets';
import { ObjectWidget } from './ObjectWidget';
import type {
  ItemSchema,
  ObjectListItem,
} from '../ObjectListWidget/objectList';

// The fields resolve their widgets from the registry, as in the app.
installWidgets(config);

const linkSchema: ItemSchema = {
  title: 'Link',
  fieldsets: [
    { id: 'default', title: 'Default', fields: ['title', 'href'] },
    { id: 'advanced', title: 'Advanced', fields: ['newTab'] },
  ],
  properties: {
    title: { title: 'Title' },
    href: { title: 'Target', description: 'A path of the site, or a URL.' },
    newTab: { title: 'Open in a new tab', type: 'boolean' },
  },
  required: ['title'],
};

function ObjectWidgetStory(args: React.ComponentProps<typeof ObjectWidget>) {
  const [value, setValue] = useState(args.value ?? null);
  return (
    <div className="max-w-md">
      <ObjectWidget {...args} value={value} onChange={setValue} />
      <pre className="mt-6 rounded-md bg-quanta-snow p-3 text-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

const meta = {
  title: 'CMSUI/Widgets/ObjectWidget',
  component: ObjectWidget,
  args: {
    name: 'link',
    label: 'Call to action',
    description: 'The link of the button.',
    value: { title: 'Read more', href: '/news' } as ObjectListItem,
    schema: linkSchema as never,
    onChange: () => {},
  },
  render: (args) => <ObjectWidgetStory {...args} />,
} satisfies Meta<typeof ObjectWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The fields of the object, with its second fieldset under its title. */
export const Default: Story = {};

/** No value yet: the fields start empty. */
export const Empty: Story = {
  args: { value: null },
};
