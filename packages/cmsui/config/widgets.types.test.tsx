import { describe, expect, it } from 'vitest';
import config from '@plone/registry';
import type { FormWidgetProps } from '@plone/types';

// The registry only accepts widgets that follow the widget contract, once
// `@plone/cmsui` declares it (`WidgetPropsMap` in `index.ts`). The type check
// is the test: these registrations must, or must not, compile.

const ContractWidget = ({
  label,
  value,
  onChange,
}: FormWidgetProps<string>) => (
  <input
    aria-label={label}
    value={value ?? ''}
    onChange={(event) => onChange(event.target.value)}
  />
);

// A widget with Volto's props: `id` instead of `name`, and `onChange(id, value)`.
const VoltoStyleWidget = ({
  id,
  onChange,
}: {
  id: string;
  onChange: (id: string, value: string) => void;
}) => <input onChange={(event) => onChange(id, event.target.value)} />;

describe('widget registry types', () => {
  it('accepts widgets that follow the widget contract', () => {
    config.registerWidget({
      key: 'widget',
      definition: { contract: ContractWidget },
    });
    expect(config.getWidget('contract', 'widget')).toBe(ContractWidget);
  });

  it('rejects widgets that do not', () => {
    config.registerWidget({
      key: 'widget',
      // @ts-expect-error A widget must take the widget contract's props.
      definition: { volto: VoltoStyleWidget },
    });
    // @ts-expect-error The default widget too.
    config.registerDefaultWidget(VoltoStyleWidget);
    expect(true).toBe(true);
  });
});
