import { useMemo } from 'react';
import type { Decorator } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { ControlPanelsProvider } from '../../provider/ControlPanelsProvider';
import { ContentTypesDriverProvider, NO_CAPABILITIES } from '../driver';
import type { ContentTypesDriver } from '../driver';
import { createMockDriver } from '../mock/createMockDriver';
import type { MockDriverOptions } from '../mock/createMockDriver';

export interface DriverParameters {
  /** Options for the mock driver. */
  mock?: MockDriverOptions;
  /** Every capability off, like plone.restapi before #2061. */
  basicBackend?: boolean;
  /** Replaces methods of the mock driver, e.g. to make one fail. */
  override?: Partial<ContentTypesDriver>;
}

function Providers({
  parameters,
  children,
}: {
  parameters: DriverParameters;
  children: React.ReactNode;
}) {
  const driver = useMemo(() => {
    const mock = createMockDriver({
      latency: 300,
      ...parameters.mock,
      capabilities: parameters.basicBackend
        ? NO_CAPABILITIES
        : parameters.mock?.capabilities,
    });
    return { ...mock, ...parameters.override };
  }, [parameters]);
  return (
    <ControlPanelsProvider
      // Stories don't leave the page: show where a link would go instead.
      navigate={action('navigate')}
      notify={action('notify')}
    >
      <ContentTypesDriverProvider driver={driver}>
        {children}
      </ContentTypesDriverProvider>
    </ControlPanelsProvider>
  );
}

/** Renders the story with the providers and a mock driver. */
export const withMockDriver: Decorator = (Story, context) => (
  <Providers parameters={(context.parameters.driver ?? {}) as DriverParameters}>
    <Story />
  </Providers>
);
