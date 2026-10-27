import type { ComponentType } from 'react';
import type { AnyPluginConfig } from 'platejs';

import type { SlashMenuConfig } from './components/editor/plugins/slash-menu';

/*
 * Add-ons extend the page editor and the page renderer with a
 * `config/plate-editor.ts` and a `config/plate-renderer.ts` module, whose
 * default export is a `PlateEditorExtension` and a `PlateRendererExtension`.
 * The somersault presets collect them, in add-on order, through
 * `@plone/registry/addons/config/plate-editor` and
 * `@plone/registry/addons/config/plate-renderer`, so their code is only
 * loaded with the editor and the renderer, never with the registry.
 */

export type PlatePlugins = AnyPluginConfig[];

/*
 * A list of plugins, appended after the ones before, or a function that gets
 * all the plugins before and returns the new list. Plate merges plugins with
 * the same key, the later one winning, so an appended
 * `SomePlugin.configure({ ... })` reconfigures a core plugin, and
 * `{ enabled: false }` disables it.
 */
export type PluginsExtension =
  PlatePlugins | ((plugins: PlatePlugins) => PlatePlugins);

export type FloatingToolbarExtension = (
  Buttons: ComponentType,
) => ComponentType;

export type PlateEditorExtension = {
  plugins?: PluginsExtension;
  slashMenu?: {
    /** Gets the groups of the slash menu and returns the new ones. */
    extendGroups?: NonNullable<SlashMenuConfig['extendGroups']>;
  };
  /**
   * Gets the floating toolbar buttons component and returns the new one,
   * for example one that renders it, then a toolbar group of its own.
   */
  floatingToolbar?: FloatingToolbarExtension;
};

export type PlateRendererExtension = {
  plugins?: PluginsExtension;
};

type AddonModules = Array<{ addon: string; module: unknown }>;

const extensionsOf = <T>(modules: AddonModules) =>
  modules.map(({ module }) => (module ?? {}) as T);

const composePlugins =
  (extensions: Array<PluginsExtension | undefined>) =>
  (plugins: PlatePlugins): PlatePlugins =>
    extensions.reduce<PlatePlugins>((acc, extension) => {
      if (!extension) return acc;
      return typeof extension === 'function'
        ? extension(acc)
        : [...acc, ...extension];
    }, plugins);

export type ComposedEditorExtensions = {
  /** Applies the add-on plugins to the core ones. */
  plugins: (plugins: PlatePlugins) => PlatePlugins;
  /** The slash menu configuration, for `createBlockEditorKit`. */
  slashMenu: SlashMenuConfig;
  /** Applies the add-on toolbar extensions to the core buttons. */
  floatingToolbar: FloatingToolbarExtension;
};

/*
 * Composes the add-on editor extensions, in add-on order, into one.
 */
export function composeEditorExtensions(
  modules: AddonModules,
): ComposedEditorExtensions {
  const extensions = extensionsOf<PlateEditorExtension>(modules);
  const extendGroups = extensions
    .map((extension) => extension.slashMenu?.extendGroups)
    .filter((extend) => typeof extend === 'function');

  return {
    plugins: composePlugins(extensions.map(({ plugins }) => plugins)),
    slashMenu: extendGroups.length
      ? {
          extendGroups: (groups, editor, context) =>
            extendGroups.reduce(
              (acc, extend) => extend(acc, editor, context),
              groups,
            ),
        }
      : {},
    floatingToolbar: (Buttons) =>
      extensions.reduce(
        (acc, extension) => extension.floatingToolbar?.(acc) ?? acc,
        Buttons,
      ),
  };
}

/*
 * Composes the add-on renderer extensions, in add-on order, into one.
 */
export function composeRendererExtensions(modules: AddonModules): {
  plugins: (plugins: PlatePlugins) => PlatePlugins;
} {
  return {
    plugins: composePlugins(
      extensionsOf<PlateRendererExtension>(modules).map(
        ({ plugins }) => plugins,
      ),
    ),
  };
}
