import { useAtom, useAtomValue } from 'jotai';
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
  const [somersaultBlock, setSomersaultBlock] = useAtom(somersaultBlockAtom);
  const content = useAtomValue(formAtom);
  const location = useLocation();
  const metadataTitle = content?.title ?? '';
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
  const stableInitialValueKey =
    location.pathname ??
    (content?.['@id'] as string | undefined) ??
    (content?.id as string | undefined) ??
    metadataTitle;

  if (stableInitialValueRef.current?.key !== stableInitialValueKey) {
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
