import type { ComponentType } from 'react';

declare const componentSignature: unique symbol;

/**
 * Declares the full signature of a registered component, instead of its
 * props, in `ComponentsPropsMap`. Use it for generic components, whose props
 * depend on a type parameter that a props type can't carry:
 *
 * ```ts
 * Container: ComponentSignature<
 *   <T extends React.ElementType = 'div'>(props: ContainerProps<T>) => ReactNode
 * >;
 * ```
 *
 * Declare the return type as `ReactNode`, so overrides can return `null`.
 */
export type ComponentSignature<C extends ComponentType<any>> = {
  [componentSignature]: C;
};

/**
 * The props of the components in the component registry, by name.
 *
 * Empty by default, so a component registered under an undeclared name can
 * take any props. A package declares the props of the components it
 * registers, so `getComponent` returns them typed, and the type checker
 * rejects an override that requires props the original doesn't get:
 *
 * ```ts
 * declare module '@plone/types' {
 *   interface ComponentsPropsMap {
 *     Link: React.ComponentProps<typeof Link>;
 *   }
 * }
 * ```
 *
 * A component registered with `dependencies` takes the props declared for its
 * name. For a generic component, declare a `ComponentSignature`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ComponentsPropsMap {}

/** The name a component is declared under, without its `|dependencies`. */
type ComponentBaseName<Name extends string> =
  Name extends `${infer Base}|${string}` ? Base : Name;

/** The type of the component registered under `Name`: see `ComponentsPropsMap`. */
export type RegisteredComponent<Name extends string> =
  ComponentBaseName<Name> extends keyof ComponentsPropsMap
    ? ComponentsPropsMap[ComponentBaseName<Name>] extends ComponentSignature<
        infer C
      >
      ? C
      : ComponentType<ComponentsPropsMap[ComponentBaseName<Name>]>
    : ComponentType<any>;
