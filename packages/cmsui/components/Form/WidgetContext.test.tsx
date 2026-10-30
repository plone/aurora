import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useWidgetContext, WidgetContextProvider } from './WidgetContext';

function Probe() {
  const { mode, path, containerPath } = useWidgetContext();
  return <output>{`${mode} ${path} ${containerPath}`}</output>;
}

const contextFor = (mode: 'add' | 'edit' | 'settings', path: string) => {
  const { container } = render(
    <WidgetContextProvider mode={mode} path={path}>
      <Probe />
    </WidgetContextProvider>,
  );
  return container.textContent;
};

describe('WidgetContext', () => {
  it('puts new objects next to the edited object', () => {
    expect(contextFor('edit', '/news/my-page')).toBe(
      'edit /news/my-page /news',
    );
    expect(contextFor('edit', '/front-page/')).toBe('edit /front-page /');
  });

  it('puts new objects in the container being added to', () => {
    expect(contextFor('add', '/news')).toBe('add /news /news');
    expect(contextFor('add', '/')).toBe('add / /');
  });

  it('is the site root without a provider', () => {
    render(<Probe />);
    expect(screen.getByRole('status').textContent).toBe('settings / /');
  });
});
