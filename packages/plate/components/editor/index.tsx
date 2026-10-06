import type { AnyPluginConfig, SlateEditor, TElement, Value } from 'platejs';
import { useEffect, useMemo, type ReactNode } from 'react';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import {
  Plate,
  usePlateEditor,
  type TPlateEditor,
  type PlateViewProps,
} from 'platejs/react';

import { Editor, EditorContainer, EditorView } from '../ui/editor';
import {
  I18nPlugin,
  defaultLanguage,
  fallbackTranslate,
  translationFromIntl,
  type TranslateFunction,
} from './plugins/i18n';

export function PlateEditor(props: {
  editorConfig: Parameters<typeof usePlateEditor>[0];
  value?: Value;
  /**
   * Translation function, react-i18next's `t` or an adapter with the same
   * signature. Pass a new one when the language changes to re-render
   * translated UI.
   */
  t?: TranslateFunction;
  /**
   * The current language, e.g. react-i18next's `i18n.language`, for `Intl`
   * formatting.
   */
  language?: string;
  /**
   * @deprecated Pass `t` and `language` instead. A react-intl `intl` object,
   * adapted internally.
   */
  intl?: any;
  children?: ReactNode;
  className?: string;
  onChange: (options: {
    editor: TPlateEditor<Value, AnyPluginConfig>;
    value: TElement[];
  }) => void;
}) {
  const legacy = useMemo(
    () =>
      props.intl?.formatMessage ? translationFromIntl(props.intl) : undefined,
    [props.intl],
  );
  const t = props.t ?? legacy?.t ?? fallbackTranslate;
  const language = props.language ?? legacy?.language ?? defaultLanguage;

  const editor = usePlateEditor({
    // Normalize the loaded value so plugin invariants hold from the start
    // (e.g. the trailing paragraph from `TrailingBlockPlugin`, container
    // blockquotes). Before Plate v53, assigning node ids on mount made every
    // node dirty and had the same effect implicitly.
    shouldNormalizeEditor: true,
    ...props.editorConfig,
    plugins: [
      ...(props.editorConfig?.plugins ?? []),
      I18nPlugin.configure({ options: { t, language } }),
    ],
    value: props.value,
  });

  // The editor is created once; keep its translation in sync with the host.
  useEffect(() => {
    editor?.setOption(I18nPlugin, 't', t);
    editor?.setOption(I18nPlugin, 'language', language);
  }, [editor, t, language]);

  return (
    <Plate
      editor={editor}
      onChange={(options) => {
        props.onChange?.(options);
      }}
    >
      {/* Provides editor context */}
      <EditorContainer className="">
        {/* Styles the editor area */}
        <Editor
          className={props.className}
          variant="block"
          placeholder="Type text..."
        />
      </EditorContainer>
      {props.children}
    </Plate>
  );
}

export type { Value } from 'platejs';
export { ElementApi, type Path } from 'platejs';
export {
  PlateController,
  createPlatePlugin,
  useEditorRef,
  useEditorSelector,
} from 'platejs/react';
export { BlockSelectionPlugin };

export function PlateRenderer(
  props: Omit<
    PlateViewProps & {
      editorConfig: Parameters<typeof usePlateEditor>[0];
      value: Value;
    },
    'editor'
  >,
) {
  const { editorConfig, ...rest } = props;

  const editor = usePlateEditor({
    ...editorConfig,
    value: props.value,
  }) as unknown as TPlateEditor<Value, AnyPluginConfig>;

  return (
    <Plate editor={editor} readOnly>
      <EditorView
        {...rest}
        editor={editor as unknown as SlateEditor}
        className={props.className}
      />
    </Plate>
  );
}

PlateRenderer.displayName = 'PlateRenderer';
