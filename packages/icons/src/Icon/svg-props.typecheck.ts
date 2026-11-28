// `check:ts` fails when the props of `*.svg?react` components, declared in
// `@plone/types`, and the props of `Icon` differ. The SVGR Vite plugin wraps
// every `*.svg?react` import in `Icon`, so they must be the same.
import type { ComponentProps } from 'react';
import type SVGComponent from '../svg/bin.svg?react';
import type { IconPropsWithoutChildren } from './Icon';

type SVGComponentProps = ComponentProps<typeof SVGComponent>;

type SameKeys<A, B> = [Exclude<keyof A, keyof B>] extends [never]
  ? [Exclude<keyof B, keyof A>] extends [never]
    ? true
    : false
  : false;

export const sameKeys: SameKeys<SVGComponentProps, IconPropsWithoutChildren> =
  true;

export const declarationFitsIcon = (
  props: SVGComponentProps,
): IconPropsWithoutChildren => props;

export const iconFitsDeclaration = (
  props: IconPropsWithoutChildren,
): SVGComponentProps => props;
