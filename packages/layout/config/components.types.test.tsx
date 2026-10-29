import type { ComponentProps, ElementType } from 'react';
import { describe, expect, it } from 'vitest';
import config from '@plone/registry';
import { Container, Link, type ContainerProps } from '@plone/components';
import installComponents from './components';

// `ComponentsPropsMap` (declared in `./components`) types the components this
// package registers. The type check is the test: these lines must, or must
// not, compile.

installComponents(config);

describe('component registry types', () => {
  it('returns registered components typed', () => {
    const RegisteredLink = config.getComponent('Link').component!;
    const RegisteredContainer = config.getComponent({
      name: 'Container',
    }).component!;

    expect(<RegisteredLink href="/news">News</RegisteredLink>).toBeTruthy();
    // @ts-expect-error `Link` doesn't take `width`.
    expect(<RegisteredLink width="narrow">News</RegisteredLink>).toBeTruthy();

    // Generic components keep their type parameters.
    expect(
      <RegisteredContainer as="section" aria-label="News">
        News
      </RegisteredContainer>,
    ).toBeTruthy();
    expect(
      // @ts-expect-error A `section` doesn't take `href`.
      <RegisteredContainer as="section" href="/news">
        News
      </RegisteredContainer>,
    ).toBeTruthy();
  });

  it('types components registered with dependencies by their name', () => {
    const NewsLink = config.getComponent('Link|News Item').component;
    expect(NewsLink).toBeUndefined();
    if (NewsLink) {
      // @ts-expect-error `Link` doesn't take `width`.
      expect(<NewsLink width="narrow" />).toBeTruthy();
    }
  });

  it('accepts overrides that take the original props', () => {
    const NewsLink = (props: ComponentProps<typeof Link>) => (
      <Link {...props} className="news" />
    );
    const Section = <T extends ElementType = 'div'>(
      props: ContainerProps<T>,
    ) => <Container {...props} width="narrow" />;

    config.registerComponent({ name: 'Link', component: NewsLink });
    config.registerComponent({ name: 'Container', component: Section });
    config.registerComponent({ name: 'Link', component: () => null });
    config.registerComponent({
      name: 'Link',
      dependencies: 'News Item',
      component: NewsLink,
    });
    expect(config.getComponent('Container').component).toBe(Section);
  });

  it('rejects overrides that require other props', () => {
    const Badge = (props: { count: number }) => <span>{props.count}</span>;

    // @ts-expect-error `Link` doesn't get `count`.
    config.registerComponent({ name: 'Link', component: Badge });
    // @ts-expect-error `Container` doesn't get `count`.
    config.registerComponent({ name: 'Container', component: Badge });
    config.registerComponent({
      name: 'Link',
      dependencies: 'News Item',
      // @ts-expect-error Neither does `Link` registered with dependencies.
      component: Badge,
    });

    // Components registered under undeclared names take any props.
    config.registerComponent({ name: 'Badge', component: Badge });
    expect(config.getComponent('Badge').component).toBe(Badge);
  });
});
