import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ContentTypesDriverProvider, useStateColor } from './driver';
import { createMockDriver } from './mock/createMockDriver';

const driver = createMockDriver();

describe('useStateColor', () => {
  it("uses the provider's stateColors over the defaults", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ContentTypesDriverProvider
        driver={driver}
        stateColors={{ published: 'blue', in_print: 'teal' }}
      >
        {children}
      </ContentTypesDriverProvider>
    );
    const { result } = renderHook(() => useStateColor(), { wrapper });
    expect(result.current({ id: 'published', visibility: 'anyone' })).toBe(
      'blue',
    );
    expect(result.current({ id: 'in_print', visibility: 'anyone' })).toBe(
      'teal',
    );
    expect(result.current({ id: 'private', visibility: 'restricted' })).toBe(
      'red',
    );
  });

  it('uses the defaults without stateColors', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ContentTypesDriverProvider driver={driver}>
        {children}
      </ContentTypesDriverProvider>
    );
    const { result } = renderHook(() => useStateColor(), { wrapper });
    expect(result.current({ id: 'published', visibility: 'anyone' })).toBe(
      'green',
    );
  });
});
