import { useState } from 'react';
import Toast from './Toast';
import config from '@plone/registry';
import { CheckboxIcon, InfoIcon, CloseIcon } from '@plone/components/Icons';
import type { ToastKey } from '../../config/toast';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queue = () =>
  config.getUtility({ name: 'queue', type: 'toast' }).method();
const show = () => config.getUtility({ name: 'show', type: 'toast' }).method;
const dismiss = () =>
  config.getUtility({ name: 'dismiss', type: 'toast' }).method;

const meta = {
  title: 'Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Bottom-center region for `react-aria-components` toasts. Queue and `show` helper are registered in `@plone/layout/config/toast.ts`.',
      },
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Minimal usage via the `show` utility. */
export const Default: Story = {
  args: { queue: queue() },
  render: (args: any) => (
    <>
      <button
        onClick={() =>
          show()({
            title: 'Saved',
            description: 'Your changes have been saved.',
          })
        }
      >
        Show toast
      </button>
      <Toast {...args} />
    </>
  ),
};

/** Variant picked by `className` on the toast item. */
export const Variants: Story = {
  args: { queue: queue() },
  render: (args: any) => (
    <>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() =>
            show()({
              title: 'Saved',
              description: 'Document published.',
              icon: <CheckboxIcon size="sm" />,
            })
          }
        >
          Success
        </button>
        <button
          onClick={() =>
            show()({
              title: 'Heads up',
              description: 'Two unsaved blocks detected.',
              icon: <InfoIcon size="sm" />,
            })
          }
        >
          Info
        </button>
        <button
          onClick={() =>
            show()({
              title: 'Could not save',
              description: 'The backend returned 500. Try again.',
              icon: <CloseIcon size="sm" />,
              className: 'error',
            })
          }
        >
          Error
        </button>
      </div>
      <Toast {...args} />
    </>
  ),
};

/** Suppress the countdown bar via `showProgress: false`. */
export const WithoutProgressBar: Story = {
  args: { queue: queue() },
  render: (args: any) => (
    <>
      <button
        onClick={() =>
          show()({
            title: 'Saved quietly',
            description: 'Auto-dismisses without the countdown bar.',
            showProgress: false,
          })
        }
      >
        Show toast (no progress bar)
      </button>
      <Toast {...args} />
    </>
  ),
};

/** `timeout: null` keeps the toast on screen until the user dismisses it. */
export const Persistent: Story = {
  args: { queue: queue() },
  render: (args: any) => (
    <>
      <button
        onClick={() =>
          show()(
            {
              title: 'Sticky toast',
              description: 'Stays until the user clicks the close button.',
            },
            { timeout: null },
          )
        }
      >
        Show persistent toast
      </button>
      <Toast {...args} />
    </>
  ),
};

/** `show()` returns a key; pass it to `dismiss(key)`. */
export const ProgrammaticDismiss: Story = {
  args: { queue: queue() },
  render: function Render(args: any) {
    const [key, setKey] = useState<ToastKey | null>(null);
    return (
      <>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() =>
              setKey(
                show()(
                  {
                    title: 'Uploading…',
                    description: 'Click "Dismiss" below when finished.',
                  },
                  { timeout: null },
                ),
              )
            }
          >
            Start
          </button>
          <button
            disabled={!key}
            onClick={() => {
              if (key) {
                dismiss()(key);
                setKey(null);
              }
            }}
          >
            Dismiss
          </button>
        </div>
        <Toast {...args} />
      </>
    );
  },
};
