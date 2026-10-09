import { useSetAtom, useStore } from 'jotai';
import * as React from 'react';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PlateEditor, type Value } from '@plone/plate/components/editor';
import plateBlockSomersaultConfig from '@plone/plate/config/presets/somersault-editor';
import { TITLE_BLOCK_TYPE } from '@plone/plate/components/editor/plugins/title';
import { SOMERSAULT_KEY } from '@plone/plate/constants';
import { LinkKit } from './plugins/link-kit';
import { SidebarPlugin } from './plugins/SidebarPlugin';
import { blockAtomFamily, formAtom } from '../../routes/atoms';

const getDefaultSomersaultValue = (title = ''): Value => [
  {
    type: TITLE_BLOCK_TYPE,
    children: [{ text: title }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
];

const BlocksEditor = () => {
  const somersaultBlockAtom = blockAtomFamily(SOMERSAULT_KEY);
  // The editor only writes the blocks. It reads the form once, below, to build
  // Plate's initial value, so it does not subscribe to the form: every
  // keystroke in Plate changes the blocks, and a subscription would re-render
  // the editor host each time.
  const store = useStore();
  const setSomersaultBlock = useSetAtom(somersaultBlockAtom);
  const location = useLocation();
  // Plate's i18n contract follows react-i18next, so `t` is passed as is.
  // Plate re-renders its translated UI when the language changes.
  const { t, i18n } = useTranslation();

  // Keep the initial Plate value stable across parent re-renders.
  // If we pass a freshly derived value on each change, Plate treats it as a
  // new controlled value and media nodes (like images) can visually blink.
  const stableInitialValueRef = React.useRef<{
    key: string;
    value: Value;
  } | null>(null);
  const stableInitialValueKey = location.pathname;

  if (stableInitialValueRef.current?.key !== stableInitialValueKey) {
    const somersaultBlock = store.get(somersaultBlockAtom);
    const metadataTitle = store.get(formAtom)?.title ?? '';
    stableInitialValueRef.current = {
      key: stableInitialValueKey,
      value:
        (((somersaultBlock as any)?.value as Value | undefined) ?? []).length >
        0
          ? ((somersaultBlock as any).value as Value)
          : getDefaultSomersaultValue(metadataTitle),
    };
  }

  const editorConfig = React.useMemo(
    () => ({
      ...plateBlockSomersaultConfig,
      plugins: [
        ...(plateBlockSomersaultConfig.plugins ?? []),
        SidebarPlugin,
        ...LinkKit,
      ],
    }),
    [],
  );

  return (
    <PlateEditor
      // The content root, as in the Public UI: themes declare their content
      // tokens on `.content-area`, so they apply to the blocks in the editor
      // too without touching the CMSUI chrome.
      className="content-area"
      editorConfig={editorConfig}
      t={t}
      language={i18n.language}
      value={stableInitialValueRef.current.value}
      onChange={(options) => {
        setSomersaultBlock((previousBlock: Record<string, unknown>) => ({
          ...(previousBlock ?? {}),
          '@type': SOMERSAULT_KEY,
          value: options.value as unknown as Value[],
        }));
      }}
    />
  );
};

export default BlocksEditor;
