import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { NodeApi } from 'platejs';
import { createPlatePlugin, type PlateEditor } from 'platejs/react';

import {
  isImageFile,
  showErrorToast,
  uploadFileToPlone,
} from '../../../hooks/use-upload-file';

export const PLONE_IMAGE_UPLOAD_KEY = 'ploneImageUpload';

function getImageFiles(dataTransfer?: DataTransfer | null) {
  return Array.from(dataTransfer?.files ?? []).filter(isImageFile);
}

/**
 * Uploads each image as an Image content item and inserts a Plone image block
 * pointing at it, replacing the current block when it is empty.
 */
export async function insertPloneImageBlocks(
  editor: PlateEditor,
  files: File[],
) {
  const entry = editor.api.block({ highest: true });
  let emptyBlockPath =
    entry && NodeApi.string(entry[0]).length === 0 ? entry[1] : undefined;

  for (const file of files) {
    let url: string;

    try {
      const uploaded = await uploadFileToPlone(file);
      // The image block expects the Image content URL and builds the scale
      // URL from it.
      url = uploaded.appUrl ?? uploaded.url;
    } catch (error) {
      showErrorToast(error);
      continue;
    }

    const node = editor.api.create.block({
      type: PLONE_BLOCK_TYPE,
      '@type': 'image',
      url,
      alt: file.name,
    });

    if (emptyBlockPath) {
      editor.tf.withoutNormalizing(() => {
        editor.tf.removeNodes({ at: emptyBlockPath });
        editor.tf.insertNodes(node, { at: emptyBlockPath, select: true });
      });
      emptyBlockPath = undefined;
    } else {
      // Selecting the inserted block puts the next image after it.
      editor.tf.insertNodes(node, { nextBlock: true, select: true });
    }
  }
}

/**
 * Pasting or dropping image files uploads them and inserts Plone image blocks.
 *
 * Aurora's presets have no Plate media nodes: images are Plone image blocks.
 * In presets that do have them, it takes over from the Plate media
 * placeholder flow for images.
 */
export const PloneImageUploadPlugin = createPlatePlugin({
  key: PLONE_IMAGE_UPLOAD_KEY,
  // Run before the media placeholder plugin, when there's one, which handles
  // the same events.
  priority: 150,
  handlers: {
    onPaste: ({ editor, event }) => {
      // Content copied from a web page carries its HTML too; leave that to
      // the HTML paste.
      if (event.clipboardData.types.includes('text/html')) return false;

      const files = getImageFiles(event.clipboardData);
      if (files.length === 0) return false;

      event.preventDefault();
      void insertPloneImageBlocks(editor, files);
      return true;
    },
    onDrop: ({ editor, event }) => {
      const files = getImageFiles(event.dataTransfer);
      if (files.length === 0) return false;

      event.preventDefault();

      const at = editor.api.findEventRange(event);
      if (at) editor.tf.select(at);

      void insertPloneImageBlocks(editor, files);
      return true;
    },
  },
});
