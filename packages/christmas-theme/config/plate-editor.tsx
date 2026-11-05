import type { PlateEditorExtension } from '@plone/plate/extensions';
import { insertBlock } from '@plone/plate/components/editor/transforms';
import { AlertPlugin, ALERT_KEY } from '../src/components/Alert/plugin';

/**
 * Plate Editor Extension for @plone/christmas-theme
 *
 * Automatically discovered by the @plone/registry Vite plugin.
 * Loaded only in the CMSUI editor.
 */
const extension: PlateEditorExtension = {
  plugins: [AlertPlugin],
  slashMenu: {
    extendGroups: (groups: any[]) =>
      groups.map((group: any) => {
        if (group.group === 'Text blocks') {
          return {
            ...group,
            items: [
              ...group.items,
              {
                icon: <span style={{ fontSize: '1.1rem' }}>🔔</span>,
                value: ALERT_KEY,
                label: 'Holiday Alert',
                keywords: ['alert', 'bell', 'warning', 'holiday', 'christmas'],
                onSelect: (editor: any, value: string) =>
                  insertBlock(editor, value),
              },
            ],
          };
        }
        return group;
      }),
  },
};

export default extension;
