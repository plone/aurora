import type { SlateEditor } from 'platejs';

import { toast } from 'sonner';

import { getTranslation } from '../components/editor/plugins/i18n';
import { announce } from './announce';

export const UNDO_TOAST_DURATION = 8000;

/**
 * Shows a notification about a change, such as "Panel deleted", with an Undo
 * action that runs the editor's undo. Ctrl+Z undoes the change too.
 */
export function showUndoToast(editor: SlateEditor, message: string) {
  const { t } = getTranslation(editor);

  toast(message, {
    duration: UNDO_TOAST_DURATION,
    action: {
      label: t('plate.undo', { defaultValue: 'Undo' }),
      onClick: () => {
        editor.tf.focus();
        editor.undo();
        announce(t('plate.undone', { defaultValue: 'Undone' }));
      },
    },
  });
}
